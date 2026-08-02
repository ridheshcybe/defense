"""Inference API endpoints.

POST /api/inference/predict  — single prediction with confidence scoring
POST /api/inference/batch    — batched predictions (one fused forward per item)
GET  /api/inference/models   — available models + versions

Concurrency: requests are queued behind an asyncio semaphore and each has a
hard 5s timeout. Heavy CPU work runs in a thread executor so the event loop
stays responsive.
"""
from __future__ import annotations

import asyncio
import time

from fastapi import APIRouter, HTTPException

from ai.api.schemas import (
    BatchRequest,
    BatchResponse,
    ModelInfo,
    PredictRequest,
    PredictResponse,
)
from ai.metrics import collector
from ai.registry import ModelRegistry

router = APIRouter(prefix="/api/inference", tags=["inference"])

#: Maximum concurrent inference requests.
REQUEST_SEMAPHORE = asyncio.Semaphore(8)
#: Hard per-request timeout in seconds.
TIMEOUT_S = 5.0


def _run_predict(pipeline, request: PredictRequest) -> dict:
    """Run one prediction off the event loop (CPU-bound)."""
    payload = request.model_dump()
    return pipeline.predict(
        satellite=pipeline.decode_base64(payload["satellite"]),
        webcam=[pipeline.decode_base64(frame) for frame in payload["webcam"]],
        csi=payload["csi"],
        audio=(
            pipeline.decode_base64(payload["audio"]) if payload.get("audio") else None
        ),
        conditions=payload.get("conditions"),
    )


def _predict_with_metrics(pipeline, request: PredictRequest) -> dict:
    started = time.perf_counter()
    try:
        result = _run_predict(pipeline, request)
        collector.record((time.perf_counter() - started) * 1000.0)
        return result
    except Exception as exc:  # noqa: BLE001 - converted to a 500 below
        collector.record((time.perf_counter() - started) * 1000.0, error=True)
        raise exc


async def _bounded(coro, timeout_s: float):
    """Run a coroutine behind the semaphore with a hard timeout."""
    async with REQUEST_SEMAPHORE:
        return await asyncio.wait_for(coro, timeout=timeout_s)


@router.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest) -> dict:
    pipeline = ModelRegistry.get().pipeline()
    try:
        return await _bounded(
            asyncio.to_thread(_predict_with_metrics, pipeline, request), TIMEOUT_S
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Inference timed out after 5s")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Inference failed: {exc}")


@router.post("/batch", response_model=BatchResponse)
async def batch(request: BatchRequest) -> dict:
    pipeline = ModelRegistry.get().pipeline()
    started = time.perf_counter()
    try:
        results = await _bounded(
            asyncio.gather(
                *(
                    asyncio.to_thread(_predict_with_metrics, pipeline, item)
                    for item in request.requests
                )
            ),
            TIMEOUT_S * max(1, len(request.requests)),
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Batch inference timed out")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Batch inference failed: {exc}")
    return {
        "predictions": results,
        "total_ms": round((time.perf_counter() - started) * 1000.0, 2),
    }


@router.get("/models", response_model=list[ModelInfo])
async def list_models() -> list[dict]:
    return [ModelRegistry.get().info()]

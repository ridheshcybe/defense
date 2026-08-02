"""SentinelFusion AI model server.

FastAPI application that loads the multimodal pipeline on startup and serves:
  GET  /health                  — liveness + model-loaded status
  GET  /metrics                 — request/latency/GPU metrics
  /api/inference/*              — predict, batch, models (see ai/api/inference.py)

Run:  .venv/bin/uvicorn ai.model_server:app --host 0.0.0.0 --port 8000
"""
from __future__ import annotations

import os
import threading

import torch
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ai.api.inference import router as inference_router
from ai.api.schemas import HealthResponse, MetricsResponse
from ai.metrics import collector
from ai.registry import ModelRegistry

_GPU_UTIL = {"value": 0.0}
_GPU_LOCK = threading.Lock()


def _sample_gpu_util() -> None:
    """Best-effort GPU utilization sampling (0.0 when no GPU / unsupported)."""
    if not torch.cuda.is_available():
        _GPU_UTIL["value"] = 0.0
        return
    try:
        _GPU_UTIL["value"] = round(float(torch.cuda.utilization()), 2)
    except Exception:  # noqa: BLE001 - utilization may be unsupported on some drivers
        _GPU_UTIL["value"] = 0.0


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Load models once on startup (singleton). Small models for tests/CI.
    ModelRegistry.get().load(small=os.environ.get("SF_SMALL_MODELS", "0") == "1")
    timer = threading.Timer(5.0, _sample_gpu_util)
    timer.daemon = True
    timer.start()
    yield
    timer.cancel()


app = FastAPI(
    title="SentinelFusion AI",
    version="0.1.0",
    description="Multimodal incident detection: satellite + webcam + WiFi CSI + audio fusion",
    lifespan=lifespan,
)

# Allow the Vite dev server (and any local frontend) to call the inference API.
# Demo-only: tighten origins when deployed behind a gateway.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(inference_router)


@app.get("/health", response_model=HealthResponse)
async def health() -> dict:
    registry = ModelRegistry.get()
    return {
        "status": "ok" if registry.info()["status"] == "loaded" else "degraded",
        "model_loaded": registry.info()["status"] == "loaded",
        "device": "cuda" if torch.cuda.is_available() else "cpu",
    }


@app.get("/metrics", response_model=MetricsResponse)
async def metrics() -> dict:
    return {**collector.snapshot(), "gpu_util": _GPU_UTIL["value"]}

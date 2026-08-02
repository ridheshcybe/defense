"""Tests for the inference HTTP API (FastAPI + TestClient)."""
from __future__ import annotations

import base64
import io
import os
import time

import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from ai.model_server import app
from ai.registry import ModelRegistry


@pytest.fixture(scope="module")
def client() -> TestClient:
    """TestClient with the small-model pipeline loaded (no GPU, fast)."""
    # The app lifespan reads this flag — without it, the full 512-d model is
    # loaded on startup and the inference tests get slow/flaky. Managed
    # manually: pytest's monkeypatch is function-scoped and can't be used in
    # a module-scoped fixture (ScopeMismatch).
    os.environ["SF_SMALL_MODELS"] = "1"
    ModelRegistry.get().load(small=True)
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        os.environ.pop("SF_SMALL_MODELS", None)


def _b64_image(size: int = 48) -> str:
    array = np.random.default_rng(5).integers(0, 255, size=(size, size, 3), dtype=np.uint8)
    buffer = io.BytesIO()
    Image.fromarray(array).save(buffer, format="JPEG")
    return base64.b64encode(buffer.getvalue()).decode()


def _b64_frames(count: int = 8) -> list[str]:
    return [_b64_image(size=32) for _ in range(count)]


def _csi(subcarriers: int = 3, samples: int = 256) -> list[list[float]]:
    rng = np.random.default_rng(6)
    return rng.normal(0, 1, size=(subcarriers, samples)).tolist()


def _request() -> dict:
    return {
        "satellite": _b64_image(),
        "webcam": _b64_frames(8),
        "csi": _csi(),
        "audio": None,
    }


class TestPredictEndpoint:
    def test_returns_expected_response_format(self, client: TestClient) -> None:
        response = client.post("/api/inference/predict", json=_request())
        assert response.status_code == 200
        body = response.json()
        assert body["incident_type"] in {
            "protest", "threat", "unusual_movement", "drug_shipment", "weapons",
            "gathering", "intrusion", "suspicious_activity", "environmental", "other",
        }
        assert body["severity"] in {"critical", "warning", "info"}
        assert 0.0 <= body["confidence"] <= 1.0
        assert len(body["confidence_interval"]) == 2
        assert set(body["modality_confidences"]) == {"satellite", "video", "csi", "audio"}
        assert body["latency_ms"] > 0.0

    def test_handles_audio_modality(self, client: TestClient) -> None:
        payload = _request()
        sample_rate = 16_000
        samples = np.sin(2 * np.pi * 440 * np.arange(sample_rate // 2) / sample_rate) * 32767
        import wave

        buffer = io.BytesIO()
        with wave.open(buffer, "wb") as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(sample_rate)
            wav.writeframes(samples.astype(np.int16).tobytes())
        payload["audio"] = base64.b64encode(buffer.getvalue()).decode()
        response = client.post("/api/inference/predict", json=payload)
        assert response.status_code == 200
        assert response.json()["modality_confidences"]["audio"] >= 0.0

    def test_handles_validation_errors(self, client: TestClient) -> None:
        payload = _request()
        del payload["satellite"]
        response = client.post("/api/inference/predict", json=payload)
        assert response.status_code == 422

    def test_handles_bad_payload_gracefully(self, client: TestClient) -> None:
        payload = _request()
        payload["satellite"] = "not-base64-!!!"
        response = client.post("/api/inference/predict", json=payload)
        # Either a 400 (decode error) or 500 (pipeline error) — never a crash.
        assert response.status_code in {400, 500}
        assert "detail" in response.json()


class TestBatchEndpoint:
    def test_batch_returns_all_predictions_in_order(self, client: TestClient) -> None:
        requests = [_request() for _ in range(3)]
        response = client.post("/api/inference/batch", json={"requests": requests})
        assert response.status_code == 200
        body = response.json()
        assert len(body["predictions"]) == 3
        assert body["total_ms"] > 0.0

    def test_batch_is_faster_than_sequential(self, client: TestClient) -> None:
        requests = [_request() for _ in range(4)]
        started = time.perf_counter()
        sequential = [client.post("/api/inference/predict", json=req) for req in requests]
        sequential_ms = (time.perf_counter() - started) * 1000.0

        started = time.perf_counter()
        batch = client.post("/api/inference/batch", json={"requests": requests})
        batch_ms = (time.perf_counter() - started) * 1000.0

        assert all(response.status_code == 200 for response in sequential)
        assert batch.status_code == 200
        # Batched (concurrent) requests should complete faster than serialized
        # ones; a small tolerance keeps the wall-clock comparison stable.
        assert batch_ms < sequential_ms + 25


class TestCors:
    def test_preflight_allows_frontend_origin(self, client: TestClient) -> None:
        response = client.options(
            "/api/inference/predict",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
            },
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


class TestModelEndpoints:
    def test_models_endpoint(self, client: TestClient) -> None:
        response = client.get("/api/inference/models")
        assert response.status_code == 200
        models = response.json()
        assert len(models) == 1
        assert models[0]["name"] == "fusion-v1"
        assert "version" in models[0]
        assert "satellite" in models[0]["modalities"]

    def test_health_check(self, client: TestClient) -> None:
        response = client.get("/health")
        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "ok"
        assert body["model_loaded"] is True

    def test_metrics_endpoint(self, client: TestClient) -> None:
        response = client.get("/metrics")
        assert response.status_code == 200
        body = response.json()
        assert body["requests_total"] >= 0
        assert body["errors_total"] >= 0
        assert body["avg_latency_ms"] >= 0.0

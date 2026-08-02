"""Pydantic request/response schemas for the inference API."""
from __future__ import annotations

from pydantic import BaseModel, Field, field_validator

from ai.constants import SEVERITY_LABELS, TYPE_LABELS


class PredictRequest(BaseModel):
    """One inference request. Audio is optional."""

    satellite: str = Field(description="Base64-encoded satellite image (JPEG/PNG/GeoTIFF)")
    webcam: list[str] = Field(
        min_length=1, description="Base64-encoded webcam/thermal frames (1..32)"
    )
    csi: list[list[float]] = Field(description="WiFi CSI matrix [subcarriers, samples]")
    audio: str | None = Field(default=None, description="Optional base64-encoded audio")
    conditions: dict[str, bool] | None = Field(
        default=None, description="Environmental conditions, e.g. {'satellite_unreliable': True}"
    )

    @field_validator("webcam")
    @classmethod
    def _limit_frames(cls, frames: list[str]) -> list[str]:
        if len(frames) > 32:
            raise ValueError("webcam accepts at most 32 frames")
        return frames


class ModelRef(BaseModel):
    name: str
    version: str


class PredictResponse(BaseModel):
    incident_type: str = Field(description="Predicted incident class")
    severity: str = Field(description="Predicted severity")
    confidence: float = Field(ge=0.0, le=1.0)
    confidence_interval: list[float] = Field(min_length=2, max_length=2)
    modality_confidences: dict[str, float]
    modality_weights: dict[str, float]
    latency_ms: float

    @field_validator("incident_type")
    @classmethod
    def _valid_type(cls, value: str) -> str:
        if value not in TYPE_LABELS:
            raise ValueError(f"Unknown incident type: {value}")
        return value

    @field_validator("severity")
    @classmethod
    def _valid_severity(cls, value: str) -> str:
        if value not in SEVERITY_LABELS:
            raise ValueError(f"Unknown severity: {value}")
        return value


class BatchRequest(BaseModel):
    requests: list[PredictRequest] = Field(min_length=1)


class BatchResponse(BaseModel):
    predictions: list[PredictResponse]
    total_ms: float


class ModelInfo(BaseModel):
    name: str
    version: str
    modalities: list[str]
    size_mb: float
    status: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    device: str


class MetricsResponse(BaseModel):
    requests_total: int
    errors_total: int
    avg_latency_ms: float
    p95_latency_ms: float
    gpu_util: float

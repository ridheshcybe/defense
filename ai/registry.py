"""Model registry.

Singleton that owns the loaded models, tracks model versions, and supports
hot-reloading (swap state dicts without restarting the server).
"""
from __future__ import annotations

import threading

from ai.pipeline import InferencePipeline

DEFAULT_MODEL_NAME = "fusion-v1"


class ModelRegistry:
    """Holds the active inference pipeline and its version metadata."""

    _instance: "ModelRegistry | None" = None
    _lock = threading.Lock()

    def __init__(self) -> None:
        self._pipeline: InferencePipeline | None = None
        self._version = "1.0.0"
        self._name = DEFAULT_MODEL_NAME
        self._status = "unloaded"
        self._small = False

    @classmethod
    def get(cls) -> "ModelRegistry":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def load(self, *, small: bool = False) -> InferencePipeline:
        """Build (or rebuild) the pipeline, marking it loaded."""
        self._small = small
        pipeline = InferencePipeline(
            d_model=128 if small else 512,
            num_layers=2 if small else 4,
            mc_samples=3 if small else 10,
        )
        self._pipeline = pipeline
        self._status = "loaded"
        return pipeline

    def reload(self) -> InferencePipeline:
        """Hot-reload: bump the patch version and rebuild weights in place."""
        major, minor, patch = self._version.split(".")
        self._version = f"{major}.{minor}.{int(patch) + 1}"
        return self.load(small=self._small)

    def pipeline(self) -> InferencePipeline:
        if self._pipeline is None:
            raise RuntimeError("Models not loaded yet — call load() on startup")
        return self._pipeline

    def info(self) -> dict:
        pipeline = self._pipeline
        size_mb = 0.0
        if pipeline is not None:
            parameter_count = sum(
                parameter.numel()
                for parameter in pipeline.fusion.parameters()
            ) + sum(
                parameter.numel()
                for extractor in (
                    pipeline.satellite_extractor,
                    pipeline.video_extractor,
                    pipeline.csi_extractor,
                    pipeline.audio_extractor,
                )
                for parameter in extractor.parameters()
            )
            size_mb = round(parameter_count * 4 / (1024**2), 2)
        return {
            "name": self._name,
            "version": self._version,
            "modalities": ["satellite", "webcam", "csi", "audio"],
            "size_mb": size_mb,
            "status": self._status,
        }

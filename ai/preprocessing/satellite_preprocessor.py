"""Satellite imagery preprocessing.

Loads GeoTIFF / JPEG / PNG bytes (or numpy arrays), resizes to the model input
size, normalizes pixels, and optionally applies training-time augmentation.
Output is a ``[3, H, W]`` float tensor in [0, 1] (or [-1, 1]).
"""
from __future__ import annotations

import io

import numpy as np
import torch
from PIL import Image


class SatellitePreprocessor:
    """Convert raw satellite bytes/arrays into model-ready image tensors."""

    def __init__(
        self,
        input_size: int = 512,
        mean: float = 0.5,
        std: float = 0.5,
        max_crop: int = 24,
    ) -> None:
        self.input_size = input_size
        self.mean = mean
        self.std = std
        self.max_crop = max_crop

    @staticmethod
    def load(source: bytes | np.ndarray | Image.Image) -> Image.Image:
        """Decode a JPEG/PNG/GeoTIFF payload (bytes) or wrap an array/Image."""
        if isinstance(source, Image.Image):
            return source.convert("RGB")
        if isinstance(source, np.ndarray):
            return Image.fromarray(source.astype(np.uint8)).convert("RGB")
        try:
            return Image.open(io.BytesIO(bytes(source))).convert("RGB")
        except Exception as exc:  # noqa: BLE001 - surface a friendly message
            raise ValueError(f"Unsupported satellite image payload: {exc}") from exc

    def resize(self, image: Image.Image) -> np.ndarray:
        """Resize to ``input_size`` and return a float32 HxWx3 array."""
        resized = image.resize((self.input_size, self.input_size), Image.BILINEAR)
        return np.asarray(resized, dtype=np.float32)

    def _augment(self, array: np.ndarray, rng: np.random.Generator) -> np.ndarray:
        """Random horizontal flip, rotation, and crop for training."""
        if rng.random() < 0.5:
            array = array[:, ::-1]
        angle = float(rng.uniform(-15, 15))
        if abs(angle) > 0.5:
            img = Image.fromarray(array.astype(np.uint8)).rotate(angle, resample=Image.BILINEAR)
            array = np.asarray(img, dtype=np.float32)
        if self.max_crop > 0:
            crop = int(rng.integers(0, self.max_crop + 1))
            if crop > 0:
                h, w = array.shape[:2]
                y = int(rng.integers(0, h - crop + 1))
                x = int(rng.integers(0, w - crop + 1))
                array = array[y : y + (h - crop), x : x + (w - crop)]
                img = Image.fromarray(array.astype(np.uint8))
                array = np.asarray(img.resize((self.input_size, self.input_size), Image.BILINEAR))
        return array

    def preprocess(
        self,
        source: bytes | np.ndarray | Image.Image,
        *,
        augment: bool = False,
        normalize: str = "01",
    ) -> torch.Tensor:
        """Return a ``[3, input_size, input_size]`` float tensor."""
        image = self.load(source)
        array = self.resize(image)
        if augment:
            rng = np.random.default_rng()
            array = self._augment(array, rng)
        # HWC -> CHW
        tensor = torch.from_numpy(np.transpose(array, (2, 0, 1))).float()
        if normalize == "01":
            tensor = tensor / 255.0
        else:  # "11" -> [-1, 1]
            tensor = tensor / 255.0 * 2.0 - 1.0
        # Channel-wise standardization.
        tensor = (tensor - self.mean) / self.std
        return tensor

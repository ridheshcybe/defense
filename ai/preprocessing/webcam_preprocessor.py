"""Webcam / thermal video preprocessing.

Decodes video frames, samples them (1 FPS or uniform N-frame sampling), applies
thermal normalization, and optionally computes optical flow features for motion.
Output is a ``[T, C, H, W]`` float tensor where ``C = 3`` (gray + flow dx/dy)
or ``C = 1`` (thermal only).
"""
from __future__ import annotations

import base64
import io

import cv2
import numpy as np
import torch

#: OpenCV expects BGR; we reorder to RGB-like gray so channels are meaningful.
def _decode_frame(payload: bytes) -> np.ndarray:
    array = np.frombuffer(bytes(payload), dtype=np.uint8)
    frame = cv2.imdecode(array, cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError("Failed to decode webcam frame (not a valid image payload)")
    return frame


class WebcamPreprocessor:
    """Convert a stream of encoded frames into a sampled tensor sequence."""

    def __init__(
        self,
        target_frames: int = 16,
        input_size: int = 224,
        sample_fps: float | None = 1.0,
        use_optical_flow: bool = True,
    ) -> None:
        self.target_frames = target_frames
        self.input_size = input_size
        self.sample_fps = sample_fps
        self.use_optical_flow = use_optical_flow

    def load(self, source: list[bytes] | list[np.ndarray]) -> list[np.ndarray]:
        """Decode a list of encoded frame payloads into BGR arrays."""
        if not source:
            raise ValueError("Webcam stream contains no frames")
        if isinstance(source[0], np.ndarray):
            return [np.asarray(frame) for frame in source]  # type: ignore[misc]
        return [_decode_frame(payload) for payload in source]  # type: ignore[arg-type]

    def sample_frames(self, frames: list[np.ndarray]) -> list[np.ndarray]:
        """Uniformly sample up to ``target_frames`` frames (1 FPS semantics)."""
        count = len(frames)
        if count <= self.target_frames:
            return frames
        indices = np.linspace(0, count - 1, self.target_frames).round().astype(int)
        return [frames[i] for i in indices]

    def _to_thermal(self, frame: np.ndarray) -> np.ndarray:
        """Convert BGR frame to a normalized single-channel thermal/gray image."""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY).astype(np.float32)
        minimum, maximum = float(gray.min()), float(gray.max())
        if maximum - minimum < 1e-6:
            return np.zeros_like(gray)
        return (gray - minimum) / (maximum - minimum)

    def _optical_flow(self, frames: list[np.ndarray]) -> list[np.ndarray]:
        """Return a list of 2-channel flow maps (dx, dy) matching frame length."""
        flows: list[np.ndarray] = []
        previous = self._to_thermal(frames[0])
        for frame in frames[1:]:
            current = self._to_thermal(frame)
            flow = cv2.calcOpticalFlowFarneback(
                previous, current, None, 0.5, 3, 15, 3, 5, 1.2, 0
            )
            flows.append(flow.astype(np.float32))
            previous = current
        # First frame has no predecessor; reuse the first flow if present.
        if flows:
            flows.insert(0, np.zeros_like(flows[0]))
        else:
            flows = [np.zeros((self.input_size, self.input_size, 2), np.float32)]
        return flows

    def preprocess(
        self, source: list[bytes] | list[np.ndarray]
    ) -> dict[str, torch.Tensor]:
        """Return ``{frames: [T, C, H, W], count: T}`` where C=3 or C=1."""
        frames = self.sample_frames(self.load(source))
        thermal = [self._to_thermal(frame) for frame in frames]
        resized = [
            cv2.resize(channel, (self.input_size, self.input_size)) for channel in thermal
        ]
        tensor = np.stack(resized)[:, None]  # [T, 1, H, W]
        if self.use_optical_flow:
            flows = [
                cv2.resize(flow, (self.input_size, self.input_size))
                for flow in self._optical_flow(frames)
            ]
            flow_tensor = np.stack(flows)  # [T, H, W, 2]
            flow_tensor = np.transpose(flow_tensor, (0, 3, 1, 2))  # [T, 2, H, W]
            tensor = np.concatenate([tensor, flow_tensor], axis=1)  # [T, 3, H, W]
        return {
            "frames": torch.from_numpy(tensor).float(),
            "count": torch.tensor(len(frames)),
        }

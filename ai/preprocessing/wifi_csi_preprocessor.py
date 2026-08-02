"""WiFi CSI preprocessing.

Takes raw CSI amplitude/phase arrays from WiFi cards, applies FFT bandpass
noise filtering, extracts frequency-domain features, and runs a lightweight
human-presence detector. Output is a ``[n_subcarriers, n_fft//2]`` feature
tensor ready for the CSI feature extractor.
"""
from __future__ import annotations

import numpy as np
import torch

try:  # pragma: no cover - scipy may be absent in minimal installs
    from scipy.signal import butter, filtfilt

    _HAS_SCIPY = True
except ImportError:  # pragma: no cover
    _HAS_SCIPY = False


class CSIPreprocessor:
    """Filter raw CSI matrices and produce frequency-domain features."""

    def __init__(
        self,
        sample_rate: float = 1000.0,
        lowcut: float = 0.5,
        highcut: float = 80.0,
        n_fft: int = 256,
        presence_threshold: float = 0.15,
    ) -> None:
        self.sample_rate = sample_rate
        self.lowcut = lowcut
        self.highcut = highcut
        self.n_fft = n_fft
        self.presence_threshold = presence_threshold

    def load(self, source: list[list[float]] | np.ndarray) -> np.ndarray:
        """Return a float32 [n_subcarriers, n_samples] matrix."""
        array = np.asarray(source, dtype=np.float32)
        if array.ndim == 1:
            array = array[None, :]
        if array.ndim != 2:
            raise ValueError(f"CSI data must be 2D [subcarriers, samples], got {array.shape}")
        return array

    def bandpass_filter(self, signal: np.ndarray) -> np.ndarray:
        """Apply a Butterworth bandpass per subcarrier to strip noise/harmonics."""
        if not _HAS_SCIPY:
            # Degenerate fallback: gentle moving average.
            kernel = np.ones(5, dtype=np.float32) / 5.0
            return np.stack(
                [np.convolve(row, kernel, mode="same") for row in signal], axis=0
            )
        nyquist = 0.5 * self.sample_rate
        low = max(self.lowcut / nyquist, 1e-4)
        high = min(self.highcut / nyquist, 0.99)
        b, a = butter(4, [low, high], btype="band")
        return np.stack([filtfilt(b, a, row) for row in signal], axis=0).astype(np.float32)

    def fft_features(self, signal: np.ndarray) -> np.ndarray:
        """Per-subcarrier magnitude spectrum, [n_subcarriers, n_fft//2]."""
        padded = np.zeros((signal.shape[0], self.n_fft), dtype=np.float32)
        width = min(signal.shape[1], self.n_fft)
        padded[:, :width] = signal[:, :width]
        window = np.hanning(self.n_fft).astype(np.float32)
        spectrum = np.fft.rfft(padded * window, axis=1)
        return np.abs(spectrum)[:, : self.n_fft // 2].astype(np.float32)

    def presence_score(self, signal: np.ndarray) -> float:
        """Human-presence probability from normalized energy variance (0..1)."""
        energy = float(np.mean(signal**2))
        if energy < 1e-6:
            return 0.0
        # Normalized AC power; thresholded and squashed into [0, 1].
        ac = float(np.mean((signal - signal.mean(axis=1, keepdims=True)) ** 2))
        ratio = ac / energy
        return float(min(1.0, max(0.0, (ratio - self.presence_threshold) * 5.0)))

    def preprocess(self, source: list[list[float]] | np.ndarray) -> dict[str, torch.Tensor]:
        """Return ``{csi: [1, n_subcarriers, n_fft//2], presence: scalar}``."""
        signal = self.bandpass_filter(self.load(source))
        features = self.fft_features(signal)
        return {
            "csi": torch.from_numpy(features[None]).float(),
            "presence": torch.tensor(self.presence_score(signal)),
        }

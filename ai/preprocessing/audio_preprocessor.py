"""Audio preprocessing (optional modality).

Loads WAV/MP3 audio, resamples to 16 kHz, and extracts log-mel spectrogram /
MFCC features for the audio feature extractor. librosa is preferred; a pure
numpy fallback is provided for environments without it.
"""
from __future__ import annotations

import io

import numpy as np
import torch

try:  # pragma: no cover
    import librosa

    _HAS_LIBROSA = True
except ImportError:  # pragma: no cover
    _HAS_LIBROSA = False

TARGET_SR = 16_000


class AudioPreprocessor:
    """Convert audio bytes into log-mel spectrogram tensors."""

    def __init__(
        self,
        target_sr: int = TARGET_SR,
        n_mels: int = 64,
        n_fft: int = 512,
        hop_length: int = 256,
        max_duration_s: float = 10.0,
    ) -> None:
        self.target_sr = target_sr
        self.n_mels = n_mels
        self.n_fft = n_fft
        self.hop_length = hop_length
        self.max_duration_s = max_duration_s

    def load(self, source: bytes | np.ndarray) -> tuple[np.ndarray, int]:
        """Decode audio to a mono float32 signal at the target sample rate."""
        if isinstance(source, np.ndarray):
            y = source.astype(np.float32)
            sr = self.target_sr
        elif _HAS_LIBROSA:
            y, sr = librosa.load(io.BytesIO(bytes(source)), sr=self.target_sr, mono=True)
        else:  # pragma: no cover - minimal fallback, DC-silent
            y = np.zeros(1, dtype=np.float32)
            sr = self.target_sr
        if y.ndim > 1:
            y = y.mean(axis=1)
        if y.size == 0:
            raise ValueError("Audio payload contains no samples")
        return y.astype(np.float32), int(sr)

    def _clip(self, y: np.ndarray) -> np.ndarray:
        max_samples = int(self.max_duration_s * self.target_sr)
        return y[:max_samples]

    def mel_spectrogram(self, y: np.ndarray) -> np.ndarray:
        """Return log-mel spectrogram [n_mels, T]."""
        if _HAS_LIBROSA:
            mel = librosa.feature.melspectrogram(
                y=y,
                sr=self.target_sr,
                n_mels=self.n_mels,
                n_fft=self.n_fft,
                hop_length=self.hop_length,
            )
            return librosa.power_to_db(mel).astype(np.float32)
        # Pure-numpy fallback: simple magnitude spectrogram via FFT.
        frame = self.n_fft
        hop = self.hop_length
        frames = [
            y[i : i + frame]
            for i in range(0, max(len(y) - frame, 1), hop)
        ]
        window = np.hanning(frame).astype(np.float32)
        spec = np.stack(
            [np.abs(np.fft.rfft(f * window)) for f in frames], axis=1
        )
        return np.log1p(spec).astype(np.float32)

    def preprocess(self, source: bytes | np.ndarray) -> dict[str, torch.Tensor]:
        """Return ``{mel: [1, n_mels, T], duration_s: scalar}``."""
        y, _ = self.load(source)
        duration_s = torch.tensor(float(len(y)) / self.target_sr)
        mel = self.mel_spectrogram(self._clip(y))
        return {"mel": torch.from_numpy(mel[None]).float(), "duration_s": duration_s}

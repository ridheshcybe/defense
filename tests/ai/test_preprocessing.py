"""Tests for the per-modality preprocessors."""
from __future__ import annotations

import io

import numpy as np
import pytest
import torch
from PIL import Image

from ai.preprocessing.audio_preprocessor import AudioPreprocessor
from ai.preprocessing.satellite_preprocessor import SatellitePreprocessor
from ai.preprocessing.webcam_preprocessor import WebcamPreprocessor
from ai.preprocessing.wifi_csi_preprocessor import CSIPreprocessor


def _image_bytes(fmt: str = "JPEG", size: tuple[int, int] = (64, 48)) -> bytes:
    array = np.random.default_rng(1).integers(0, 255, size=(*size, 3), dtype=np.uint8)
    buffer = io.BytesIO()
    Image.fromarray(array).save(buffer, format=fmt)
    return buffer.getvalue()


class TestSatellitePreprocessor:
    def test_handles_jpeg_png_and_arrays(self) -> None:
        processor = SatellitePreprocessor(input_size=64)
        for source in (_image_bytes("JPEG"), _image_bytes("PNG")):
            tensor = processor.preprocess(source)
            assert tensor.shape == (3, 64, 64)
            assert torch.isfinite(tensor).all()
        array = np.random.default_rng(2).integers(0, 255, size=(32, 32, 3)).astype(np.uint8)
        tensor = processor.preprocess(array)
        assert tensor.shape == (3, 64, 64)

    def test_normalization_range(self) -> None:
        processor = SatellitePreprocessor(input_size=32)
        tensor = processor.preprocess(_image_bytes())
        assert float(tensor.min()) >= -1.0
        assert float(tensor.max()) <= 1.0
        # Mean/std normalization lands near 0 mean.
        assert abs(float(tensor.mean())) < 1.0

    def test_rejects_garbage_payload(self) -> None:
        with pytest.raises(ValueError):
            SatellitePreprocessor(input_size=32).preprocess(b"not-an-image")


class TestWebcamPreprocessor:
    def _frames(self, count: int = 40, size: int = 64) -> list[bytes]:
        rng = np.random.default_rng(3)
        frames = []
        for _ in range(count):
            frame = rng.integers(0, 255, size=(size, size, 3), dtype=np.uint8)
            buffer = io.BytesIO()
            Image.fromarray(frame).save(buffer, format="JPEG")
            frames.append(buffer.getvalue())
        return frames

    def test_samples_frames_to_target(self) -> None:
        processor = WebcamPreprocessor(target_frames=16, input_size=64)
        result = processor.preprocess(self._frames(40))
        assert result["frames"].shape == (16, 3, 64, 64)
        assert result["count"].item() == 16

    def test_short_stream_stays_short(self) -> None:
        processor = WebcamPreprocessor(target_frames=8, input_size=64)
        result = processor.preprocess(self._frames(3))
        # Fewer frames than the target are kept as-is (no upsampling).
        assert result["frames"].shape[0] == 3
        assert result["count"].item() == 3

    def test_rejects_empty_stream(self) -> None:
        with pytest.raises(ValueError):
            WebcamPreprocessor().preprocess([])


class TestCSIPreprocessor:
    def test_output_shape_and_presence(self) -> None:
        processor = CSIPreprocessor(n_fft=256)
        signal = np.random.default_rng(4).normal(0, 1, size=(3, 512)).tolist()
        result = processor.preprocess(signal)
        assert result["csi"].shape == (1, 3, 128)
        assert 0.0 <= float(result["presence"]) <= 1.0

    def test_bandpass_removes_high_frequency_noise(self) -> None:
        processor = CSIPreprocessor(sample_rate=1000.0, lowcut=1.0, highcut=10.0, n_fft=512)
        t = np.linspace(0, 1.0, 1000, endpoint=False)
        # 5 Hz signal + 200 Hz noise (well outside the passband).
        signal = np.sin(2 * np.pi * 5 * t) + 0.5 * np.sin(2 * np.pi * 200 * t)
        filtered = processor.bandpass_filter(signal[None, :])[0]
        noisy_energy = float(np.mean(signal**2))
        filtered_energy = float(np.mean(filtered**2))
        # Filtered signal should retain most of the low-frequency power.
        assert filtered_energy > 0.3 * noisy_energy

    def test_handles_1d_input(self) -> None:
        processor = CSIPreprocessor(n_fft=128)
        result = processor.preprocess([0.0] * 256)
        assert result["csi"].shape == (1, 1, 64)


class TestAudioPreprocessor:
    def test_mel_shape(self) -> None:
        processor = AudioPreprocessor(n_mels=64)
        # Synthesize a 1s 440 Hz tone as 16-bit PCM WAV bytes.
        sample_rate = 16_000
        samples = (np.sin(2 * np.pi * 440 * np.arange(sample_rate) / sample_rate) * 32767)
        raw = samples.astype(np.int16).tobytes()
        import wave

        buffer = io.BytesIO()
        with wave.open(buffer, "wb") as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(sample_rate)
            wav.writeframes(raw)
        result = processor.preprocess(buffer.getvalue())
        assert result["mel"].shape[0] == 1
        assert result["mel"].shape[1] == 64
        assert result["mel"].dtype == torch.float32

    def test_rejects_empty_audio(self) -> None:
        processor = AudioPreprocessor()
        with pytest.raises(ValueError):
            processor.preprocess(np.array([], dtype=np.float32))

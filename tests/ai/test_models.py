"""Tests for feature extractors, the fusion transformer, and uncertainty."""
from __future__ import annotations

import torch

from ai.models.audio_feature_extractor import AudioFeatureExtractor
from ai.models.csi_feature_extractor import CSIFeatureExtractor
from ai.models.multimodal_transformer import MultimodalTransformer
from ai.models.satellite_feature_extractor import SatelliteFeatureExtractor
from ai.models.video_feature_extractor import VideoFeatureExtractor
from ai.uncertainty import (
    confidence_from_uncertainty,
    confidence_interval,
    mc_dropout_predict,
    modality_weights,
)

DIMS = {"satellite": 512, "video": 512, "csi": 128, "audio": 256}


def _build_fusion(include_audio: bool = True) -> MultimodalTransformer:
    dims = dict(DIMS)
    if not include_audio:
        del dims["audio"]
    return MultimodalTransformer(
        modality_dims=dims, d_model=64, nhead=4, num_layers=2, dim_feedforward=128
    )


class TestFeatureExtractors:
    def test_satellite_dimensions(self) -> None:
        model = SatelliteFeatureExtractor(output_dim=512, backbone="light")
        out = model(torch.randn(2, 3, 64, 64))
        assert out.shape == (2, 512)

    def test_video_dimensions(self) -> None:
        model = VideoFeatureExtractor(output_dim=512, num_frames=16, embed_dim=64, num_heads=4)
        out = model(torch.randn(2, 16, 3, 64, 64))
        assert out.shape == (2, 512)

    def test_video_accepts_shorter_clips(self) -> None:
        model = VideoFeatureExtractor(output_dim=512, num_frames=16, embed_dim=64, num_heads=4)
        out = model(torch.randn(2, 8, 3, 64, 64))
        assert out.shape == (2, 512)

    def test_csi_dimensions(self) -> None:
        model = CSIFeatureExtractor(output_dim=128)
        out = model(torch.randn(2, 3, 128))
        assert out.shape == (2, 128)

    def test_audio_dimensions(self) -> None:
        model = AudioFeatureExtractor(output_dim=256)
        out = model(torch.randn(2, 1, 64, 100))
        assert out.shape == (2, 256)


class TestMultimodalTransformer:
    def _features(self, batch: int = 2, include_audio: bool = True) -> dict[str, torch.Tensor]:
        features = {
            "satellite": torch.randn(batch, DIMS["satellite"]),
            "video": torch.randn(batch, DIMS["video"]),
            "csi": torch.randn(batch, DIMS["csi"]),
        }
        if include_audio:
            features["audio"] = torch.randn(batch, DIMS["audio"])
        return features

    def test_full_forward(self) -> None:
        model = _build_fusion()
        outputs = model(**self._features())
        assert outputs["type_logits"].shape == (2, 10)
        assert outputs["severity_logits"].shape == (2, 3)
        assert outputs["mu"].shape == (2,)
        assert outputs["logvar"].shape == (2,)
        assert outputs["reliability"].shape == (2, 4)
        assert outputs["fused"].shape == (2, 64)

    def test_missing_audio_modality(self) -> None:
        model = _build_fusion(include_audio=False)
        outputs = model(**self._features(include_audio=False))
        assert torch.isfinite(outputs["type_logits"]).all()
        # Absent audio should have zero reliability.
        assert float(outputs["reliability"][0, 3]) == 0.0

    def test_single_modality_only(self) -> None:
        model = _build_fusion()
        outputs = model(satellite=torch.randn(1, DIMS["satellite"]))
        assert torch.isfinite(outputs["type_logits"]).all()
        assert float(outputs["reliability"][0, 0]) > 0.0
        assert float(outputs["reliability"][0, 1]) == 0.0

    def test_classification_heads_produce_probabilities(self) -> None:
        model = _build_fusion()
        model.eval()
        with torch.no_grad():
            outputs = model(**self._features(batch=1))
        type_probs = torch.softmax(outputs["type_logits"], dim=-1)
        severity_probs = torch.softmax(outputs["severity_logits"], dim=-1)
        assert torch.allclose(type_probs.sum(dim=-1), torch.tensor(1.0))
        assert torch.allclose(severity_probs.sum(dim=-1), torch.tensor(1.0))

    def test_loss_backpropagates(self) -> None:
        model = _build_fusion()
        model.train()
        outputs = model(**self._features(batch=2), modality_dropout=True)
        loss = MultimodalTransformer.compute_loss(
            outputs,
            type_target=torch.tensor([0, 5]),
            severity_target=torch.tensor([1, 2]),
            value_target=torch.tensor([1.0, 0.0]),
        )
        assert torch.isfinite(loss)
        loss.backward()
        assert model.type_head.weight.grad is not None


class TestUncertainty:
    def test_confidence_in_range(self) -> None:
        model = _build_fusion()
        model.eval()
        features = {
            "satellite": torch.randn(4, DIMS["satellite"]),
            "video": torch.randn(4, DIMS["video"]),
            "csi": torch.randn(4, DIMS["csi"]),
        }
        mean_probs, epistemic_var = mc_dropout_predict(model, features, num_samples=5)
        assert mean_probs.shape == (4, 10)
        assert epistemic_var.shape == (4,)
        with torch.no_grad():
            outputs = model(**features)
        confidence = confidence_from_uncertainty(epistemic_var, outputs["logvar"])
        assert bool((confidence >= 0.0).all())
        assert bool((confidence <= 1.0).all())

    def test_confidence_interval(self) -> None:
        interval = confidence_interval(torch.tensor([0.5]), torch.tensor([0.0]))
        assert interval.shape == (1, 2)
        assert float(interval[0, 0]) < float(interval[0, 1])

    def test_modality_weights_renormalize_and_drop_cloudy(self) -> None:
        reliability = torch.tensor([0.9, 0.6, 0.3, 0.0])
        weights = modality_weights(reliability)
        assert abs(sum(weights.values()) - 1.0) < 1e-6
        cloudy = modality_weights(reliability, conditions={"satellite_unreliable": True})
        assert cloudy["satellite"] == 0.0
        assert abs(sum(cloudy.values()) - 1.0) < 1e-6

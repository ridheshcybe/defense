"""Inference pipeline.

Wires preprocessing -> feature extraction -> multimodal fusion -> uncertainty
quantification into a single callable used by the FastAPI inference endpoints.
"""
from __future__ import annotations

import base64
import time

import torch

from ai.constants import MODALITY_ORDER, SEVERITY_LABELS, TYPE_LABELS
from ai.models.audio_feature_extractor import AudioFeatureExtractor
from ai.models.csi_feature_extractor import CSIFeatureExtractor
from ai.models.multimodal_transformer import MultimodalTransformer
from ai.models.satellite_feature_extractor import SatelliteFeatureExtractor
from ai.models.video_feature_extractor import VideoFeatureExtractor
from ai.preprocessing.audio_preprocessor import AudioPreprocessor
from ai.preprocessing.satellite_preprocessor import SatellitePreprocessor
from ai.preprocessing.webcam_preprocessor import WebcamPreprocessor
from ai.preprocessing.wifi_csi_preprocessor import CSIPreprocessor
from ai.uncertainty import (
    confidence_from_uncertainty,
    confidence_interval,
    mc_dropout_predict,
    modality_weights,
)

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


class InferencePipeline:
    """End-to-end prediction: raw payloads in, incident prediction out."""

    def __init__(
        self,
        *,
        d_model: int = 512,
        satellite_dim: int = 512,
        video_dim: int = 512,
        csi_dim: int = 128,
        audio_dim: int = 256,
        num_layers: int = 4,
        mc_samples: int = 10,
        device: str = DEVICE,
    ) -> None:
        self.device = device
        self.mc_samples = mc_samples

        self.satellite_pre = SatellitePreprocessor(input_size=256)
        self.webcam_pre = WebcamPreprocessor(target_frames=16, input_size=224)
        self.csi_pre = CSIPreprocessor()
        self.audio_pre = AudioPreprocessor()

        self.satellite_extractor = SatelliteFeatureExtractor(
            output_dim=satellite_dim, backbone="light"
        ).to(device)
        self.video_extractor = VideoFeatureExtractor(
            output_dim=video_dim, num_frames=16
        ).to(device)
        self.csi_extractor = CSIFeatureExtractor(output_dim=csi_dim).to(device)
        self.audio_extractor = AudioFeatureExtractor(output_dim=audio_dim).to(device)

        self.fusion = MultimodalTransformer(
            modality_dims={
                "satellite": satellite_dim,
                "video": video_dim,
                "csi": csi_dim,
                "audio": audio_dim,
            },
            d_model=d_model,
            num_layers=num_layers,
        ).to(device)

        self.fusion.eval()
        self.extractors_eval()

    def extractors_eval(self) -> None:
        """Put feature extractors in eval mode (deterministic, no dropout)."""
        for module in (
            self.satellite_extractor,
            self.video_extractor,
            self.csi_extractor,
            self.audio_extractor,
        ):
            module.eval()

    def predict(
        self,
        *,
        satellite: bytes,
        webcam: list[bytes],
        csi: list[list[float]],
        audio: bytes | None = None,
        conditions: dict[str, bool] | None = None,
    ) -> dict:
        """Run the full pipeline and return the prediction payload."""
        started = time.perf_counter()
        features = self._extract_features(
            satellite=satellite, webcam=webcam, csi=csi, audio=audio
        )
        with torch.no_grad():
            mean_probs, epistemic_var = mc_dropout_predict(
                self.fusion, features, num_samples=self.mc_samples
            )
            outputs = self.fusion(**features)
            logvar = outputs["logvar"]
            mu = outputs["mu"]

        type_index = int(mean_probs.argmax(dim=-1).item())
        severity_index = int(outputs["severity_logits"].argmax(dim=-1).item())
        confidence = float(
            confidence_from_uncertainty(epistemic_var, logvar)[0].item()
        )
        interval = confidence_interval(mu, logvar)[0].tolist()
        reliability = outputs["reliability"][0]
        weights = modality_weights(reliability, conditions)

        elapsed_ms = (time.perf_counter() - started) * 1000.0
        return {
            "incident_type": TYPE_LABELS[type_index],
            "severity": SEVERITY_LABELS[severity_index],
            "confidence": round(confidence, 4),
            "confidence_interval": [round(v, 4) for v in interval],
            "modality_confidences": {
                name: round(float(reliability[i].item()), 4)
                for i, name in enumerate(MODALITY_ORDER)
            },
            "modality_weights": {
                name: round(weight, 4) for name, weight in weights.items()
            },
            "latency_ms": round(elapsed_ms, 2),
        }

    def _extract_features(
        self,
        *,
        satellite: bytes,
        webcam: list[bytes],
        csi: list[list[float]],
        audio: bytes | None,
    ) -> dict[str, torch.Tensor]:
        """Preprocess payloads and run each feature extractor."""
        satellite_tensor = self.satellite_pre.preprocess(satellite).unsqueeze(0).to(self.device)
        webcam_tensor = self.webcam_pre.preprocess(webcam)["frames"].unsqueeze(0).to(self.device)
        csi_tensor = self.csi_pre.preprocess(csi)["csi"].to(self.device)

        with torch.no_grad():
            satellite_feat = self.satellite_extractor(satellite_tensor)
            video_feat = self.video_extractor(webcam_tensor)
            csi_feat = self.csi_extractor(csi_tensor)
            features: dict[str, torch.Tensor] = {
                "satellite": satellite_feat,
                "video": video_feat,
                "csi": csi_feat,
            }
            if audio is not None:
                mel = self.audio_pre.preprocess(audio)["mel"].unsqueeze(0).to(self.device)
                features["audio"] = self.audio_extractor(mel)
        return features

    @staticmethod
    def decode_base64(payload: str) -> bytes:
        """Decode a base64 payload, tolerating data-URL prefixes."""
        if "," in payload and payload.strip().startswith("data:"):
            payload = payload.split(",", 1)[1]
        return base64.b64decode(payload)

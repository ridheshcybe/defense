"""Multimodal fusion transformer.

Concatenates per-modality feature vectors, adds learnable modality embeddings
and positional encodings, runs N layers of full cross-modal self-attention
(every modality attends to every other), and produces:
  - incident-type logits
  - severity logits
  - aleatoric confidence (mu, log-var) for NLL regression
  - per-modality reliability scores (sigmoid) used for confidence weighting

Missing modalities are masked out of attention entirely, so the model works
with any subset (e.g. no audio).
"""
from __future__ import annotations

import torch
import torch.nn as nn
import torch.nn.functional as F

from ai.constants import MODALITY_ORDER, SEVERITY_VALUE, TYPE_LABELS


class _TokenEmbedding(nn.Module):
    """Modality-agnostic projection + learnable modality embedding."""

    def __init__(self, input_dim: int, d_model: int) -> None:
        super().__init__()
        self.projection = nn.Linear(input_dim, d_model)
        self.modality_embedding = nn.Parameter(torch.randn(d_model) * 0.02)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.projection(x) + self.modality_embedding


class MultimodalTransformer(nn.Module):
    """Cross-modal transformer fusing satellite + video + csi (+ audio)."""

    def __init__(
        self,
        modality_dims: dict[str, int],
        num_types: int = len(TYPE_LABELS),
        num_severities: int = 3,
        d_model: int = 512,
        nhead: int = 8,
        num_layers: int = 4,
        dim_feedforward: int = 2048,
        dropout: float = 0.3,
        modality_dropout: float = 0.15,
    ) -> None:
        super().__init__()
        if set(modality_dims) - set(MODALITY_ORDER):
            raise ValueError(f"Unknown modalities: {set(modality_dims) - set(MODALITY_ORDER)}")
        self.modality_order = MODALITY_ORDER
        self.d_model = d_model
        self.num_types = num_types
        self.num_severities = num_severities
        self.modality_dropout = modality_dropout

        self.embeddings = nn.ModuleDict(
            {name: _TokenEmbedding(dim, d_model) for name, dim in modality_dims.items()}
        )
        self.positional = nn.Parameter(torch.randn(1, len(MODALITY_ORDER) + 1, d_model) * 0.02)
        layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_feedforward,
            dropout=dropout,
            batch_first=True,
            activation="gelu",
        )
        self.encoder = nn.TransformerEncoder(layer, num_layers=num_layers)
        self.norm = nn.LayerNorm(d_model)

        self.type_head = nn.Linear(d_model, num_types)
        self.severity_head = nn.Linear(d_model, num_severities)
        self.mu_head = nn.Linear(d_model, 1)
        self.logvar_head = nn.Linear(d_model, 1)
        self.reliability_head = nn.Linear(d_model, len(MODALITY_ORDER))

    def forward(
        self,
        satellite: torch.Tensor | None = None,
        video: torch.Tensor | None = None,
        csi: torch.Tensor | None = None,
        audio: torch.Tensor | None = None,
        *,
        modality_dropout: bool = False,
    ) -> dict[str, torch.Tensor]:
        """Fuse modality features.

        Args:
            satellite/video/csi/audio: [B, dim] feature vectors or None if absent.
            modality_dropout: randomly drop present modalities during training.

        Returns:
            dict with type_logits, severity_logits, mu, logvar,
            reliability (B, 4), fused (B, d_model).
        """
        inputs = {
            "satellite": satellite,
            "video": video,
            "csi": csi,
            "audio": audio,
        }
        present = {name: value for name, value in inputs.items() if value is not None}
        if not present:
            raise ValueError("At least one modality must be provided")
        batch = next(iter(present.values())).shape[0]
        device = next(iter(present.values())).device

        if modality_dropout and self.training and len(present) > 1:
            keep = {
                name: value
                for name, value in present.items()
                if torch.rand(1).item() > self.modality_dropout
            }
            present = keep or present

        # Build token sequence: [CLS, satellite, video, csi, audio].
        # Missing modalities become masked padding tokens.
        tokens: list[torch.Tensor] = []
        mask = torch.ones(
            batch, len(self.modality_order) + 1, dtype=torch.bool, device=device
        )
        tokens.append(torch.zeros(batch, 1, self.d_model, device=device))
        mask[:, 0] = False
        for index, name in enumerate(self.modality_order):
            if name in present:
                tokens.append(self.embeddings[name](present[name]).unsqueeze(1))
                mask[:, index + 1] = False
            else:
                tokens.append(torch.zeros(batch, 1, self.d_model, device=device))
        sequence = torch.cat(tokens, dim=1) + self.positional

        encoded = self.encoder(sequence, src_key_padding_mask=mask)
        fused = self.norm(encoded[:, 0])

        reliability = torch.sigmoid(self.reliability_head(fused))
        # Zero-out reliability for modalities that were absent.
        present_flags = torch.tensor(
            [name in present for name in self.modality_order], device=device
        ).float()
        reliability = reliability * present_flags

        return {
            "type_logits": self.type_head(fused),
            "severity_logits": self.severity_head(fused),
            "mu": self.mu_head(fused).squeeze(-1),
            "logvar": self.logvar_head(fused).squeeze(-1),
            "reliability": reliability,
            "fused": fused,
        }

    @staticmethod
    def compute_loss(
        outputs: dict[str, torch.Tensor],
        type_target: torch.Tensor,
        severity_target: torch.Tensor,
        value_target: torch.Tensor,
        *,
        w_type: float = 1.0,
        w_severity: float = 1.0,
        w_confidence: float = 1.0,
    ) -> torch.Tensor:
        """Weighted CE(type) + CE(severity) + NLL(mu, logvar | value)."""
        type_loss = F.cross_entropy(outputs["type_logits"], type_target)
        severity_loss = F.cross_entropy(outputs["severity_logits"], severity_target)
        mu = outputs["mu"]
        variance = torch.exp(outputs["logvar"]).clamp_min(1e-6)
        nll = 0.5 * ((value_target - mu).pow(2) / variance + outputs["logvar"])
        return (
            w_type * type_loss
            + w_severity * severity_loss
            + w_confidence * nll.mean()
        )

    def severity_value(self, label: str) -> float:
        """Continuous severity target for the confidence head."""
        return SEVERITY_VALUE[label]

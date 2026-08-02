"""CSI feature extractor.

A 1D CNN operating on per-subcarrier frequency spectra
[subcarriers, n_fft//2] to produce a compact CSI embedding. The first layer is
a lazy projection so any subcarrier count is accepted (WiFi card dependent).
"""
from __future__ import annotations

import torch
import torch.nn as nn


class CSIFeatureExtractor(nn.Module):
    """Map [B, n_subcarriers, n_freq] CSI spectra to [B, output_dim] vectors."""

    def __init__(self, output_dim: int = 128, hidden_dim: int = 64) -> None:
        super().__init__()
        self.output_dim = output_dim
        # LazyConv1d infers the subcarrier count from the first input, so the
        # same extractor serves 1-subcarrier test data and 30-subcarrier WiFi cards.
        self.net = nn.Sequential(
            nn.LazyConv1d(hidden_dim, 5, stride=2, padding=2),
            nn.BatchNorm1d(hidden_dim),
            nn.ReLU(inplace=True),
            nn.Conv1d(hidden_dim, hidden_dim * 2, 5, stride=2, padding=2),
            nn.BatchNorm1d(hidden_dim * 2),
            nn.ReLU(inplace=True),
            nn.AdaptiveAvgPool1d(1),
        )
        self.projection = nn.Linear(hidden_dim * 2, output_dim)
        self.norm = nn.LayerNorm(output_dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: [B, n_subcarriers, n_freq] -> treat subcarriers as channels.
        features = self.net(x)
        return self.norm(self.projection(features.flatten(1)))

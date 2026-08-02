"""Audio feature extractor.

A compact VGG-style 2D CNN over log-mel spectrograms [1, n_mels, T] producing
a fixed-dim audio embedding. (VGGish/Wav2Vec2 can be swapped in behind the same
interface when weights are available.)
"""
from __future__ import annotations

import torch
import torch.nn as nn


class AudioFeatureExtractor(nn.Module):
    """Map [B, 1, n_mels, T] spectrograms to [B, output_dim] vectors."""

    def __init__(self, output_dim: int = 256) -> None:
        super().__init__()
        self.output_dim = output_dim
        self.net = nn.Sequential(
            nn.Conv2d(1, 32, 3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            nn.Conv2d(64, 128, 3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.AdaptiveAvgPool2d(1),
        )
        self.projection = nn.Linear(128, output_dim)
        self.norm = nn.LayerNorm(output_dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        features = self.net(x)
        return self.norm(self.projection(features.flatten(1)))

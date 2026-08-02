"""Video feature extractor.

A TimeSformer-style spatiotemporal encoder: per-frame 2D conv stem + a temporal
transformer over the sampled frames. Takes [B, T, C, H, W] and returns
[B, output_dim]. No external HF dependency — pure PyTorch.
"""
from __future__ import annotations

import torch
import torch.nn as nn


class _FrameStem(nn.Module):
    """Shared per-frame 2D conv stem producing per-frame embeddings."""

    def __init__(self, in_channels: int = 3, embed_dim: int = 512) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(in_channels, 64, 7, stride=2, padding=3),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 128, 3, stride=2, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.Conv2d(128, embed_dim, 3, stride=2, padding=1),
            nn.BatchNorm2d(embed_dim),
            nn.ReLU(inplace=True),
            nn.AdaptiveAvgPool2d(1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x).flatten(1)


class VideoFeatureExtractor(nn.Module):
    """Map [B, T, C, H, W] video clips to [B, output_dim] vectors."""

    def __init__(
        self,
        output_dim: int = 512,
        num_frames: int = 16,
        embed_dim: int = 512,
        num_heads: int = 8,
        num_layers: int = 2,
        dropout: float = 0.1,
    ) -> None:
        super().__init__()
        self.output_dim = output_dim
        self.num_frames = num_frames
        self.stem = _FrameStem(embed_dim=embed_dim)
        self.positional = nn.Parameter(torch.randn(num_frames, embed_dim) * 0.02)
        layer = nn.TransformerEncoderLayer(
            d_model=embed_dim,
            nhead=num_heads,
            dim_feedforward=embed_dim * 4,
            dropout=dropout,
            batch_first=True,
            activation="gelu",
        )
        self.temporal = nn.TransformerEncoder(layer, num_layers=num_layers)
        self.projection = nn.Linear(embed_dim, output_dim)
        self.norm = nn.LayerNorm(output_dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        batch, frames = x.shape[0], x.shape[1]
        frames = min(frames, self.num_frames)
        x = x[:, :frames]
        # [B*T, C, H, W] -> [B, T, embed_dim]
        flattened = x.reshape(batch * frames, *x.shape[2:])
        tokens = self.stem(flattened).reshape(batch, frames, -1)
        tokens = tokens + self.positional[:frames]
        encoded = self.temporal(tokens)
        # Mean-pool across time for a clip-level descriptor.
        pooled = encoded.mean(dim=1)
        return self.norm(self.projection(pooled))

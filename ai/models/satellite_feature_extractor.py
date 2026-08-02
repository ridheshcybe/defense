"""Satellite feature extractor.

ResNet50 (torchvision) by default; a lightweight CNN for tests/CPU demo.
Outputs a fixed-dim feature vector per image. Weights default to random init
(architecture-only); pass ``pretrained=True`` to load ImageNet weights.
"""
from __future__ import annotations

import torch
import torch.nn as nn


class _LightBackbone(nn.Module):
    """Small 2D CNN used when ``backbone='light'`` (fast, deterministic)."""

    def __init__(self, in_channels: int = 3) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(in_channels, 32, 3, stride=2, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 64, 3, stride=2, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 128, 3, stride=2, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.AdaptiveAvgPool2d(1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x).flatten(1)


class SatelliteFeatureExtractor(nn.Module):
    """Map a [B, 3, H, W] satellite image to a [B, output_dim] vector."""

    def __init__(
        self,
        output_dim: int = 512,
        backbone: str = "resnet50",
        pretrained: bool = False,
    ) -> None:
        super().__init__()
        self.output_dim = output_dim
        self.backbone_name = backbone
        if backbone == "resnet50":
            try:
                from torchvision.models import resnet50

                weights = "IMAGENET1K_V2" if pretrained else None
                self.backbone = resnet50(weights=weights)
                self.backbone.fc = nn.Identity()
                backbone_dim = 2048
            except ImportError:  # pragma: no cover
                self.backbone = _LightBackbone()
                backbone_dim = 128
        elif backbone == "light":
            self.backbone = _LightBackbone()
            backbone_dim = 128
        else:
            raise ValueError(f"Unknown satellite backbone: {backbone}")
        self.projection = nn.Linear(backbone_dim, output_dim)
        self.norm = nn.LayerNorm(output_dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        features = self.backbone(x)
        return self.norm(self.projection(features))

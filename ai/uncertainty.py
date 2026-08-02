"""Uncertainty quantification.

Two complementary sources are combined into a single confidence score:
  - epistemic (model) uncertainty from Monte-Carlo dropout
  - aleatoric (data) uncertainty from the model's predicted variance

Confidence = 1 - sqrt(epistemic_var + aleatoric_var), clamped to [0, 1].
"""
from __future__ import annotations

import torch

from ai.constants import MODALITY_ORDER


def _enable_dropout(model: torch.nn.Module, active: bool) -> None:
    """Temporarily enable dropout layers without switching model.train()."""
    for module in model.modules():
        if isinstance(module, torch.nn.Dropout):
            module.train(active)  # type: ignore[attr-defined]


def mc_dropout_predict(
    model: torch.nn.Module,
    features: dict[str, torch.Tensor],
    num_samples: int = 10,
    **forward_kwargs,
) -> tuple[torch.Tensor, torch.Tensor]:
    """Run inference ``num_samples`` times with dropout enabled.

    Returns (mean_logits, epistemic_variance) where variance is the mean
    per-sample variance of class probabilities (batch,).
    """
    # IMPORTANT: call eval() BEFORE enabling dropout. eval() recursively sets
    # training=False on every module, so applying it after _enable_dropout would
    # wipe out the dropout enablement and the MC variance would be ~0.
    model.eval()
    _enable_dropout(model, True)
    try:
        samples = []
        with torch.no_grad():
            for _ in range(num_samples):
                outputs = model(**features, **forward_kwargs)
                samples.append(torch.softmax(outputs["type_logits"], dim=-1))
        probabilities = torch.stack(samples)  # [S, B, num_types]
    finally:
        _enable_dropout(model, False)
        model.eval()
    mean_probs = probabilities.mean(dim=0)
    epistemic_variance = probabilities.var(dim=0).mean(dim=-1)  # [B]
    return mean_probs, epistemic_variance


def aleatoric_variance(logvar: torch.Tensor) -> torch.Tensor:
    """Data uncertainty from the predicted log-variance."""
    return torch.exp(logvar).clamp_min(1e-6)


def confidence_from_uncertainty(
    epistemic_variance: torch.Tensor,
    logvar: torch.Tensor,
) -> torch.Tensor:
    """Combine epistemic + aleatoric uncertainty into confidence in [0, 1]."""
    total_variance = epistemic_variance + aleatoric_variance(logvar)
    return (1.0 - torch.sqrt(total_variance)).clamp(0.0, 1.0)


def confidence_interval(
    mu: torch.Tensor, logvar: torch.Tensor, z: float = 1.96
) -> torch.Tensor:
    """95% (default) confidence interval from the aleatoric head."""
    sigma = torch.sqrt(aleatoric_variance(logvar))
    return torch.stack([mu - z * sigma, mu + z * sigma], dim=-1)


def modality_weights(
    reliability: torch.Tensor,
    conditions: dict[str, bool] | None = None,
) -> dict[str, float]:
    """Per-modality weights from reliability scores.

    Applies environmental conditions (e.g. cloudy satellite -> satellite
    reliability forced to 0, so webcam/CSI carry the prediction).
    """
    values = dict(zip(MODALITY_ORDER, reliability.detach().cpu().tolist()))
    for name in values:
        if conditions and conditions.get(f"{name}_unreliable", False):
            values[name] = 0.0
    total = sum(values.values())
    if total <= 0.0:
        return {name: 0.0 for name in MODALITY_ORDER}
    return {name: value / total for name, value in values.items()}

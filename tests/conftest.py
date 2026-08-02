"""Shared pytest fixtures — deterministic seeds for reproducible model tests."""
from __future__ import annotations

import numpy as np
import pytest
import torch


@pytest.fixture(autouse=True)
def _seed() -> None:
    """Deterministic seeds before every test."""
    torch.manual_seed(0)
    np.random.seed(0)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(0)
    torch.set_num_threads(1)

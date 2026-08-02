"""Lightweight in-process metrics for the inference API.

Tracks request/error counts and latency percentiles. In production this would
be Prometheus/OpenTelemetry, but a small collector keeps the dependency set
minimal while exposing the same /metrics contract.
"""
from __future__ import annotations

import threading
from collections import deque


class MetricsCollector:
    """Thread-safe request/error counters and latency tracking."""

    def __init__(self, max_latency_samples: int = 1000) -> None:
        self._lock = threading.Lock()
        self._requests = 0
        self._errors = 0
        self._latencies: deque[float] = deque(maxlen=max_latency_samples)

    def record(self, latency_ms: float, *, error: bool = False) -> None:
        with self._lock:
            self._requests += 1
            if error:
                self._errors += 1
            self._latencies.append(latency_ms)

    def snapshot(self) -> dict:
        with self._lock:
            latencies = sorted(self._latencies)
            count = len(latencies)
            if count:
                average = sum(latencies) / count
                p95 = latencies[min(int(0.95 * count), count - 1)]
            else:
                average, p95 = 0.0, 0.0
            return {
                "requests_total": self._requests,
                "errors_total": self._errors,
                "avg_latency_ms": round(average, 2),
                "p95_latency_ms": round(p95, 2),
            }


# Module-level singleton shared by the router and the server.
collector = MetricsCollector()

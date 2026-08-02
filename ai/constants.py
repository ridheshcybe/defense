"""Shared label spaces and modality order for the SentinelFusion AI pipeline.

Kept in lockstep with the frontend types (src/types/index.ts).
"""

#: Modalities in fusion order. Audio is optional and may be absent.
MODALITY_ORDER = ("satellite", "video", "csi", "audio")

#: Incident type classes (10) — matches frontend IncidentType.
TYPE_LABELS = (
    "protest",
    "threat",
    "unusual_movement",
    "drug_shipment",
    "weapons",
    "gathering",
    "intrusion",
    "suspicious_activity",
    "environmental",
    "other",
)

#: Severity classes — matches frontend IncidentSeverity.
SEVERITY_LABELS = ("critical", "warning", "info")

#: Continuous severity target used by the aleatoric (confidence) head.
SEVERITY_VALUE = {"critical": 2.0, "warning": 1.0, "info": 0.0}

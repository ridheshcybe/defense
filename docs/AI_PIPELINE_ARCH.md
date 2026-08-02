# SentinelFusion — Multimodal AI Pipeline Architecture

The AI backend fuses **satellite imagery**, **webcam/thermal video**, **WiFi CSI**,
and **optional audio** into a single incident prediction (type + severity) with
calibrated confidence scores. It powers the Analyst, Field Ops, and Leadership
dashboards.

**Stack:** Python 3.10+ · PyTorch (2.x) · FastAPI · numpy/OpenCV/PIL · librosa.
**Repo layout:** `ai/` (package) + `tests/ai/` + this doc. The frontend lives in
`sentinelfusion-frontend/`.

---

## 1. System diagram

```mermaid
flowchart LR
    subgraph SOURCES["Data Sources"]
        S1[Satellite imagery<br/>GeoTIFF / JPEG / PNG]
        S2[Webcam / thermal<br/>video streams]
        S3[WiFi CSI<br/>amplitude + phase]
        S4[Audio<br/>WAV / MP3 (optional)]
    end

    subgraph PRE["Preprocessing (per modality)"]
        P1[SatellitePreprocessor<br/>decode · resize 512 · normalize 0-1 · augment]
        P2[WebcamPreprocessor<br/>frame sample 1FPS→16 · thermal norm · optical flow]
        P3[CSIPreprocessor<br/>bandpass filter · FFT · presence detection]
        P4[AudioPreprocessor<br/>resample 16kHz · log-mel spectrogram]
    end

    subgraph FE["Feature Extractors"]
        E1[SatelliteFeatureExtractor<br/>ResNet50 / light CNN → 512-d]
        E2[VideoFeatureExtractor<br/>TimeSformer-style → 512-d]
        E3[CSIFeatureExtractor<br/>1D CNN → 128-d]
        E4[AudioFeatureExtractor<br/>VGG-style 2D CNN → 256-d]
    end

    subgraph FUSION["Multimodal Fusion"]
        F1[Per-modality projections<br/>+ learnable modality embeddings]
        F2[Cross-modal transformer<br/>4 layers · full self-attention<br/>+ positional encodings]
        F3[Fused representation 512-d]
    end

    subgraph HEADS["Classification + Uncertainty"]
        H1[Type head<br/>10 classes]
        H2[Severity head<br/>critical/warning/info]
        H3[Aleatoric head<br/>μ, log σ²]
        H4[Reliability head<br/>per-modality sigmoid]
    end

    subgraph QUANT["Uncertainty Quantification"]
        Q1[MC-dropout ×10<br/>epistemic variance]
        Q2[Confidence = 1 − √(σ²_epi + σ²_ale)]
        Q3[Modality weighting<br/>cloudy satellite → drop satellite]
    end

    S1 --> P1 --> E1 --> F1
    S2 --> P2 --> E2 --> F1
    S3 --> P3 --> E3 --> F1
    S4 --> P4 --> E4 --> F1
    F1 --> F2 --> F3 --> H1 & H2 & H3 & H4
    H1 & H2 & H3 --> Q1 --> Q2 --> OUT[Incident DTO<br/>type · severity · confidence · CI]
    H4 --> Q3 --> OUT
    OUT --> API[POST /api/inference/predict]
```

---

## 2. Preprocessing pipelines

| Modality | Input | Processing | Output tensor |
|---|---|---|---|
| Satellite | GeoTIFF/JPEG/PNG bytes | decode → resize → standardize; train-time flip/rotate/crop | `[3, 512, 512]` |
| Webcam/thermal | 1..32 encoded frames | 1 FPS/uniform sampling → gray → optical flow (Farneback) | `[16, 3, 224, 224]` |
| WiFi CSI | `float[subcarriers][samples]` | Butterworth bandpass 0.5–80 Hz → per-subcarrier FFT | `[1, n_sub, 128]` |
| Audio (opt.) | WAV/MP3 bytes | resample 16 kHz → log-mel spectrogram | `[1, 64, T]` |

All preprocessors live in `ai/preprocessing/` and are pure functions of their
input — no state carried between requests.

---

## 3. Feature extractors

| Extract | Backbone | Output |
|---|---|---|
| `satellite_feature_extractor.py` | ResNet50 (torchvision) or light CNN | 512-d |
| `video_feature_extractor.py` | Per-frame 2D stem + temporal transformer (TimeSformer-style) | 512-d |
| `csi_feature_extractor.py` | 1D CNN over subcarrier spectra | 128-d |
| `audio_feature_extractor.py` | VGG-style 2D CNN over mel spectrograms | 256-d |

Weights default to **random init (architecture-only)**; pass `pretrained=True`
to load ImageNet weights. GPU acceleration: `device = cuda if available`.

---

## 4. Multimodal fusion (layer-by-layer)

`ai/models/multimodal_transformer.py`

```
Input tokens: [CLS, sat, video, csi, audio]   (absent modalities → masked pads)
  ├─ Per-modality Linear projection → d_model=512
  ├─ + learnable modality embedding (per modality)
  ├─ + learnable positional encoding
  ├─ ×4 TransformerEncoderLayer (nhead=8, dim_ff=2048, dropout=0.3, pre-LN)
  │     every token attends to all others → cross-modal attention
  └─ CLS token → fused 512-d representation

Heads (from fused):
  - type_head        Linear(512 → 10)
  - severity_head    Linear(512 → 3)
  - mu/logvar head   aleatoric confidence (μ, log σ²)
  - reliability_head Linear(512 → 4) + sigmoid → per-modality confidence

Training loss = w_t·CE(type) + w_s·CE(severity) + w_c·NLL(μ, log σ² | value)
Optimizer AdamW, weight decay 1e-4, modality dropout p=0.15 (train only).
```

Missing modalities are masked out of attention entirely, so the model works
with any subset (e.g. audio absent).

---

## 5. Latency budget (target < 500 ms end-to-end)

| Stage | Budget |
|---|---|
| Payload decode + preprocessing | ≤ 80 ms |
| Satellite features (ResNet50) | ≤ 100 ms |
| Video features (16 frames) | ≤ 120 ms |
| CSI features | ≤ 20 ms |
| Audio features (optional) | ≤ 40 ms |
| Cross-modal fusion (4 layers) | ≤ 40 ms |
| MC-dropout ×10 + scoring | ≤ 80 ms |
| Serialization + overhead | ≤ 20 ms |

Each HTTP request is bounded by a hard **5 s timeout** (`asyncio.wait_for`) and
concurrency is limited by a **semaphore (8)**.

---

## 6. Uncertainty quantification

`ai/uncertainty.py`

- **Epistemic (model):** Monte-Carlo dropout — run inference 10× with dropout
  enabled, take the variance of class probabilities.
- **Aleatoric (data):** the head predicts `(μ, log σ²)`; trained with an NLL
  (Gaussian) loss. Provides the 95% confidence interval.
- **Combined confidence:** `confidence = 1 − √(σ²_epi + σ²_ale)`, clamped to [0,1].
- **Modality weighting:** reliability head emits per-modality sigmoid scores;
  environmental conditions (e.g. `satellite_unreliable: true` for cloud cover)
  zero a modality's weight and the rest are renormalized.

---

## 7. Model versioning & serving

- Every artifact is tagged `fusion-v1.<minor>.<patch>`; `GET /api/inference/models`
  lists name/version/size/status.
- `ModelRegistry` (singleton) loads models **on startup** and supports **hot-reload**
  (`POST`-able via registry.reload() → bumps patch, rebuilds weights).
- `GET /health` liveness + model-loaded; `GET /metrics` request/latency/GPU.

---

## 8. API contract

```jsonc
// POST /api/inference/predict
{
  "satellite": "<base64>",
  "webcam": ["<base64>", "<base64>"],
  "csi": [[0.12, 0.31, ...], [0.11, 0.29, ...]],
  "audio": "<base64>" // optional
}
// 200
{
  "incident_type": "intrusion",
  "severity": "warning",
  "confidence": 0.87,
  "confidence_interval": [0.79, 0.95],
  "modality_confidences": { "satellite": 0.9, "video": 0.8, "csi": 0.6, "audio": 0.0 },
  "modality_weights": { "satellite": 0.4, "video": 0.35, "csi": 0.25, "audio": 0.0 },
  "latency_ms": 412.3
}

// POST /api/inference/batch → { "predictions": [...], "total_ms": 1234 }
// GET  /api/inference/models  → [{ "name": "fusion-v1", "version": "1.0.0", ... }]
```

---

## 9. Testing

`tests/ai/`:
- `test_preprocessing.py` — image format handling, frame sampling, CSI filtering.
- `test_models.py` — extractor dims, missing-modality masking, head probabilities,
  confidence ∈ [0,1].
- `test_inference.py` — response format, error handling, batch speedup, health.

Run: `.venv/bin/python -m pytest tests/ -q`

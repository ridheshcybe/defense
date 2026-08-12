# AOI and Incident Graph Overview

## 1. Purpose

The AOI and Incident Graph provides the spatial and contextual structure
for SentinelFusion. It connects monitored areas (AOIs) with observations,
data sources, detected incidents, and related entities.

The goal is to allow an analyst to understand not only what incident was
detected, but also where it occurred, which observations contributed to
the detection, and how those observations are related.

## 2. Core Graph Objects

The initial graph is based on the following core objects
- AOI
- Observation
- Incident
- Entity
- Zone

## 3. Overall Relationsip map

The initial relationship structure is:

```text
AOI
|__ contains ---> Zone
|__ contains ---> Observation
|__ contains ---> Incident

Observation
|__ contributes_to --> Incident

Incident
|__ associated_with ---> Entity
|__ located_in ---> Zone
```

## 4. Relationship with the Multimodal AI Pipeline

Observations originate from the data sources supported by SentinelFusion:

- Satellite imagery 
- Webcam / thermal video
- WiFi CSI
- Optional audio

These observations are processed by the multimodal AI pipeline described in `SENTINELFUSION_SPEC.md`.

The resulting prediction can then be associated with the relevant AOI and incident.

```text
Satellite ──┐
Webcam ─────┤
WiFi CSI ───┼──> Multimodal AI ──> Incident
Audio ──────┘                         |
                                      |
                                      ↓
                                     AOI
```

## 5. Core Object Definitions

### 5.1 AOI

An AOI (Area of Interest) represents a geographic area monitored or analyzed by SentinelFusion.

An AOI may be associated with observations, incidents, zones, and other relevant entities.

### 5.2 Observation

An Observation represents data collected from a supported data source within or associated with an AOI.

Supported observation sources currently include:

- Satellite
- Webcam / thermal
- WiFi CSI
- Audio

### 5.3 Incident

An Incident represents a detected event or activity identified by the SentinelFusion intelligence pipeline.

The current AI specification represents an incident prediction using:

- Incident type
- Severity
- Confidence
- Confidence interval
- Modality confidences
- Modality weights
- Latency

### 5.4 Entity

An Entity represents an object or subject that can be associated with an incident or other graph object.

The exact entity types are not yet defined in this overview.

### 5.5 Zone

A Zone represents a subdivision or classification within an AOI.

The exact zone types and their relationship to AOIs are not yet defined.

## 6. AOI Structure

An AOI represents the geographic area being monitored or analyzed.

An AOI may contain multiple zones and may be associated with observations and incidents occurring within the monitored area.

```text
                         AOI
                          │
             ┌────────────┴────────────┐
             │                         │
             ▼                         ▼
           Zone                    Observation
             │                         │
             │                         │
             └────────────┐            │
                          │            │
                          ▼            ▼
                       Incident ◄──────┘
```
### What does this mean?

Inside the geographic area you might have:

```text
AOI-001 — Chennai Port Area
│
├── Zone-A — Port entrance
├── Zone-B — Container yard
│
├── Observation-001
│     └── source: satellite
│
├── Observation-002
│     └── source: webcam
│
└── Incident-001
      ├── type: intrusion
      ├── severity: warning
      └── confidence: 0.87
```
## 7. Incident Graph

An incident represents a detected event produced or supported by the SentinelFusion intelligence pipeline.

An incident can be connected to the observations that contributed to its
detection, the zone in which it occurred, and related entities.

```text
                  Observation
                       │
                       │ contributes_to
                       ▼
                    Incident
                    /       \
                   /         \
                  ▼           ▼
               Zone         Entity
                  │
                  │ located within
                  ▼
                 AOI
```
## 8. AI-to-Graph Flow

The multimodal AI pipeline processes observations from the supported
data sources and produces an incident prediction. The prediction is
then represented as an incident in the graph and associated with its
geographic and contextual information.

``` text
Satellite ──┐
Webcam ─────┤
WiFi CSI ───┼──► Multimodal AI ───► Incident
Audio ──────┘                           │
                                       │
                         ┌─────────────┼─────────────┐
                         │             │             │
                         ▼             ▼             ▼
                       Zone          Entity     Observation
                         │                           ▲
                         │                           │
                         └──────────► AOI ◄──────────┘
```

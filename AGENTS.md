# SentinelFusion Agent Instructions

You are an AI coding agent working on SentinelFusion.

- AOI-centric defence/security intelligence platform
- Fuses satellite, webcam, and news data
- Role-based UIs: Analyst, Field Ops, Leadership, Crew Transport

Key docs:
- docs/SENTINELFUSION_SPEC.md — master spec
- docs/SENTINFUSION_TASKS.tsv — task list (single source of truth; the with-EL duplicate was removed)

Rules:
1. Review spec before architecture changes
2. Work task-by-task from TSV
3. Small, reviewable commits
4. React + Vite + TypeScript only (frontend repo)
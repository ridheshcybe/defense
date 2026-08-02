# SentinelFusion — Freebuff Execution Plans

Planned: 2026-08-02 · Source of truth for task status: `docs/SENTINFUSION_TASKS.tsv`

Step-by-step, human-readable plans for the current Freebuff priority queue. Each plan answers **What**, **How**, **Where**, and **How to Verify**.

Priority order:
1. **T80** — Git repo initialization
2. **T82** — Fix vitest glob (exclude `._*`)
3. **T79** — Kanban board setup (GitHub Projects)
4. **T77** — Query → SQL mappings (T30)
5. **T53** — Satellite data collector script

---

## Task: T80 — Git repo initialization

### What

Initialize a git repository at the project root so all work can be tracked in small, reviewable commits (AGENTS.md rule 3). Right now `git status` fails with *"not a git repository"*, and there's no root `.gitignore` — so `node_modules/`, `.venv/`, 50–100 GB of datasets, and macOS `._*` junk would all get committed.

### How

1. `cd /Volumes/T7/defence`
2. Create root `.gitignore`:

   ```gitignore
   # Python / AI backend
   __pycache__/
   *.py[cod]
   .venv/
   *.egg-info/
   .pytest_cache/

   # Node / frontend
   node_modules/
   dist/
   dist-ssr/
   coverage/

   # macOS junk
   .DS_Store
   **/._*
   ._*

   # Large data artifacts (never commit datasets)
   data/multimodal_datasets/
   data/raw/
   *.tar.gz
   *.tif
   *.mat
   *.h5
   *.hdf5

   # Env & secrets
   .env
   .env.*
   *.pem
   ```

   (`sentinelfusion-frontend/.gitignore` already exists — leave it; it covers node_modules/dist/.DS_Store. The root file covers everything else.)
3. `git init -b main` (creates the repo and sets the `main` branch in one step)
4. Preview what will be committed: `git status --short | head -40` — confirm no `node_modules/`, `.venv/`, or `data/multimodal_datasets/` entries
5. `git add .`
6. `git commit -m "Initial commit: SentinelFusion monorepo (frontend + AI backend + docs)"`
7. Branch convention going forward: work on feature branches off `main` (e.g., `git checkout -b feat/freebuff`), commit per task.

### Where

- Root: `.git/` (created), `.gitignore` (new)
- `sentinelfusion-frontend/.gitignore` (exists — optionally add a `**/._*` line)

### How to Verify

- [ ] `git status` shows a clean working tree (no "not a git repository" error)
- [ ] `git log --oneline` shows the initial commit
- [ ] `git check-ignore -v node_modules` and `git check-ignore -v .venv` both resolve
- [ ] `git status --short` contains no `node_modules/`, `.venv/`, or dataset paths

---

## Task: T82 — Fix vitest glob (exclude `._*`)

### What

Stop vitest from collecting macOS AppleDouble junk files (`._IncidentList.test.tsx`, etc.). These are metadata sidecars that contain a NUL byte and fail to parse — currently the suite shows **186 real tests passing but 30 phantom "failed" files**, drowning out real CI signal.

### How

1. Open `sentinelfusion-frontend/vite.config.ts`
2. Add an `exclude` array to the `test` block. **Important:** in Vitest 4, setting `exclude` *replaces* the defaults (`["**/node_modules/**", "**/.git/**"]` — verified in the installed package), so list them explicitly:

   ```ts
   test: {
     environment: 'jsdom',
     globals: true,
     setupFiles: ['./src/test/setup.ts'],
     css: false,
     exclude: ['**/._*', '**/node_modules/**', '**/.git/**'],
     coverage: { /* unchanged */ },
   },
   ```

3. Add `**/._*` to `sentinelfusion-frontend/.gitignore` (and root `.gitignore` from T80) so the junk is never committed.
4. Optional cleanup of existing junk: `find sentinelfusion-frontend/src -name '._*' -type f -delete` (sidecar metadata only — check the count first with `find . -name '._*' | wc -l`).

### Where

- `sentinelfusion-frontend/vite.config.ts` (the `test` block)
- `sentinelfusion-frontend/.gitignore` (+ root `.gitignore`)

### How to Verify

- [ ] `cd sentinelfusion-frontend && npx vitest run` reports **0 failed test files** (was 30)
- [ ] Real count still shows 186 passed across 30 files
- [ ] No `Invalid Character \u0000` / `._` file in the run output

---

## Task: T79 — Kanban board setup (GitHub Projects)

### What

Stand up a visible Kanban (Backlog → In Progress → Review → Done) so all 83 tasks have a home and progress is visible at a glance. **External task — blocked on GitHub access and T80** (the repo must exist first); it cannot be completed from the CLI without `gh` auth.

### How

1. **Depends on T80.** Push the repo: `gh repo create sentinelfusion --public --source . --push` (or create on github.com). *Blocked if `gh auth status` fails — log in first.*
2. GitHub web UI → repo → **Projects** → **New project** → Kanban template.
3. Set columns to: `Backlog`, `In Progress`, `Review`, `Done` (per TSV note for T79).
4. Load cards from the TSV — bulk-import open tasks (everything with Status ≠ Done):

   ```bash
   awk -F'\t' 'NR>1 && $6 != "Done" {print "gh project item-add <NUMBER> --owner <owner> --title \"" $1 " — " $3 "\""}' docs/SENTINFUSION_TASKS.tsv
   ```

   Paste each card's `Notes` column into the item description; add `Priority` and `Owner` custom fields.
5. Sync rule: the **TSV stays the source of truth** (T35); the board mirrors it. Update the board when a task flips status.

### Where

- External: GitHub repo + GitHub Projects board (no repo files change)
- Data source: `docs/SENTINFUSION_TASKS.tsv`

### How to Verify

- [ ] `gh project list` shows the board with 4 columns
- [ ] Every Not started / In progress task has a card with Owner + Priority
- [ ] First card ("T80 — Git repo initialization") is in **Done** by the time this is set up

---

## Task: T77 — Query → SQL mappings (T30)

### What

Write the explicit natural-language query → ontology → SQL mapping for the spec's example queries (the Mumbai demo query especially). This closes T30's gap and makes the demo concrete against Snowflake/Databricks.

### How

1. Source queries from `docs/SENTINELFUSION_SPEC.md` §3.4 ("Uses") + §6.2.1:
   - **Q1:** "Show me recent incidents in or near Mumbai with terrorist-related groups."
   - **Q2:** "Find all incidents in Tier 1 AOIs in the last 24 hours affecting target zones."
   - **Q3:** "List entities that appear in multiple high-severity incidents across AOIs."
2. Build a 3-column table per query: **NL query → Ontology** (nodes/edges/fields from §3.1–3.4 — `incident`, `aoi`, `zone`, `group`, `entity`, edges → join tables `incident_aoi`, `incident_group`, `incident_zone`) **→ SQL**.
3. Example for Q1 (Snowflake dialect):

   ```sql
   SELECT i.id, i.type, i.severity, i.created_at
   FROM incident i
   JOIN incident_group ig ON ig.incident_id = i.id
   JOIN "group" g        ON g.id = ig.group_id
   JOIN incident_aoi ia  ON ia.incident_id = i.id
   JOIN aoi a            ON a.id = ia.aoi_id
   WHERE i.tenant_id = :tenant                       -- multi-tenant rule §4.3
     AND g.tag ILIKE '%terror%'
     AND (a.name ILIKE 'Mumbai%' OR ST_DWithin(a.geometry, :mumbai_geom, 50000))
     AND i.created_at >= CURRENT_DATE - INTERVAL '30 days'
   ORDER BY i.created_at DESC;
   ```

   Q2 adds `JOIN incident_zone` + `a.tier = 1` + `z.type = 'target'` + 24-hour window; Q3 uses `GROUP BY entity` + `HAVING COUNT(DISTINCT incident_id) > 1` + `severity = 'high'`.
4. Write it as spec **§7.4 "Example query → SQL mappings"** (keeps T35 honest) or `docs/QUERY_MAPPINGS.md`; note the dialect (Databricks uses `ST_Distance` instead of `ST_DWithin`).
5. Update TSV: T77 → In progress → Done; add a note on T30 linking to T77.

### Where

- `docs/SENTINELFUSION_SPEC.md` (new §7.4) or `docs/QUERY_MAPPINGS.md`
- `docs/SENTINFUSION_TASKS.tsv` (T77, T30 statuses)

### How to Verify

- [ ] ≥3 queries mapped, each with ontology + runnable SQL
- [ ] SQL uses only fields defined in §3.1–3.4 (no invented columns)
- [ ] Every query filters by `tenant_id`
- [ ] TSV shows T77 Done; T30 note points to it

---

## Task: T53 — Satellite data collector script

### What

A repeatable Python collector that pulls satellite imagery (thermal/RGB, HS later) from Copernicus/Sentinel-2, NASA Earthdata, and Wyvern into `data/raw/`, feeding the existing `SatellitePreprocessor` (which already accepts image bytes → `[3, 512, 512]` tensor). Turns the one-off `data/curl.bash` downloader into a structured, manifest-driven pipeline.

### How

1. Create `scripts/satellite_collector.py`:

   ```
   - SOURCES config: provider -> {url_template, auth, params}
     * Copernicus Sentinel-2  (OData API, anonymous)
     * NASA Earthdata          (EARTHDATA_TOKEN from .env)
     * Wyvern                  (WYVERN_KEY from .env)   # blocked: needs API key
   - collect(provider, aoi, date_range) -> list[Path]
     1. build OData/CQL query from AOI bbox + date range
     2. download scenes to data/raw/satellite/<provider>/<date>/
     3. write metadata.json sidecar: source, timestamp, CRS, bands, cloud cover
   - --dry-run: print URLs only (safe to test, nothing downloaded)
   ```

2. Reuse the GLiHT pattern already in `data/curl.bash` + `data/index.txt` (URL manifest → fetch → verify) as the reference implementation; the script generalizes it.
3. Feed output into the existing AI code — collector bytes go straight to `SatellitePreprocessor().load(...)` (already handles GeoTIFF/JPEG/PNG).
4. `requests` is **not** currently in `requirements.txt`/`pyproject.toml` — either add it to both, or use stdlib `urllib.request` to keep zero new deps.
5. Credentials live in `.env` (gitignored via T80).

### Where

- New: `scripts/satellite_collector.py` (+ `data/manifest.csv`)
- Modified: `requirements.txt`, `pyproject.toml` (only if adding `requests`)
- Output: `data/raw/satellite/…` (gitignored)
- Reference: `data/curl.bash`, `data/index.txt`, `ai/preprocessing/satellite_preprocessor.py`

### How to Verify

- [ ] `python scripts/satellite_collector.py --dry-run` prints valid provider URLs, downloads nothing
- [ ] A 1-scene test run writes `data/raw/satellite/<provider>/<date>/` + `metadata.json`
- [ ] Downloaded bytes load via `SatellitePreprocessor().load(f.read())` → tensor shape `[3, 512, 512]`
- [ ] No credentials in logs; `.env` values gitignored

---

## Blocked / unclear flags

- **T79** — blocked on GitHub access + T80 (`gh auth status` to check).
- **T53** — Wyvern/Earthdata need API keys; start with anonymous Copernicus + the already-working GLiHT URLs.
- **T77** — pick one warehouse dialect for the SQL examples (Snowflake recommended; Databricks note included).

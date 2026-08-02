#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# All-in-One Multimodal Datasets Downloader (updated: uses `hf` instead of
# deprecated `huggingface-cli`)
# =============================================================================
# Downloads:
#   - Hyperspectral classic: Salinas, Indian Pines, PaviaU
#   - Kust4K RGB‑TIR (Figshare)
#   - OHID‑1 hyperspectral (Figshare)
#   - SegFly RGB & RGB‑T (Hugging Face)
#   - DroneVehicle RGB‑LWIR (Hugging Face)
#   - G‑LiHT (NASA) – one example tile (extendable)
#   - STARCOP (Zenodo)
#   - AeroRIT (direct .mat if available)
#   - Indoor real‑world HS scenes (MIT)
#   - HyperSpectral Salient Object Detection dataset
#   - Multi‑spectral motion (RGB+LWIR+depth)
#
# Total size: 50–100+ GB if you enable everything.
# =============================================================================

ROOT_DIR="multimodal_datasets"
mkdir -p "$ROOT_DIR"
cd "$ROOT_DIR"

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

download() {
  local url="$1"
  local out="$2"
  local desc="${3:-}"

  if [[ -n "$desc" ]]; then
    log "Downloading: $desc"
  fi
  log "  URL: $url"
  log "  OUT: $out"
  curl -L -C - --progress-bar -o "$out" "$url"
  log "  Done: $out"
  echo ""
}

ensure_hf() {
  if ! command -v hf >/dev/null 2>&1; then
    log "hf not found. Installing huggingface_hub[cli]..."
    if command -v pip >/dev/null 2>&1; then
      pip install -q --upgrade "huggingface_hub[cli]"
    elif command -v pip3 >/dev/null 2>&1; then
      pip3 install -q --upgrade "huggingface_hub[cli]"
    else
      log "ERROR: pip/pip3 not found. Please install Python pip and then huggingface_hub[cli]."
      exit 1
    fi
  fi
}

# -----------------------------------------------------------------------------
# 1) Classic Hyperspectral: Salinas, Indian Pines, PaviaU
# -----------------------------------------------------------------------------
log "=== 1) Classic Hyperspectral Datasets ==="
mkdir -p hyperspectral/classic

log "--- Salinas (AVIRIS) ---"
download \
  "http://www.ehu.eus/ccwintco/uploads/a/a3/Salinas_corrected.mat" \
  "hyperspectral/classic/Salinas_corrected.mat" \
  "Salinas hyperspectral cube (corrected, ~27.6 MB)"

download \
  "http://www.ehu.eus/ccwintco/uploads/f/fa/Salinas_gt.mat" \
  "hyperspectral/classic/Salinas_gt.mat" \
  "Salinas ground truth (~26.6 MB)"

log "--- Indian Pines (AVIRIS, processed .mat) ---"
download \
  "http://www.ehu.eus/ccwintco/uploads/2/22/Indian_pines_corrected.mat" \
  "hyperspectral/classic/IndianPines_corrected.mat" \
  "Indian Pines hyperspectral cube (corrected, ~6 MB)"

download \
  "http://www.ehu.eus/ccwintco/uploads/9/93/Indian_pines_gt.mat" \
  "hyperspectral/classic/IndianPines_gt.mat" \
  "Indian Pines ground truth"

log "--- Pavia University (ROSIS) ---"
download \
  "https://raw.githubusercontent.com/gobber/pavia-dataset/master/pavia_uni.mat" \
  "hyperspectral/classic/PaviaU.mat" \
  "Pavia University hyperspectral data (~10–15 MB)"

# -----------------------------------------------------------------------------
# 2) Kust4K RGB‑TIR (Figshare)
# -----------------------------------------------------------------------------
log "=== 2) Kust4K RGB‑TIR Segmentation (Figshare) ==="
mkdir -p rgb_thermal

download \
  "https://figshare.com/ndownloader/articles/29577224/versions/1" \
  "rgb_thermal/Kust4K.zip" \
  "Kust4K RGB‑TIR segmentation dataset (~2.59 GB)"

# -----------------------------------------------------------------------------
# 3) OHID‑1 (Figshare)
# -----------------------------------------------------------------------------
log "=== 3) OHID‑1 Hyperspectral (Figshare) ==="
mkdir -p hyperspectral/OHID1

download \
  "https://figshare.com/ndownloader/articles/27966024/versions/8" \
  "hyperspectral/OHID1/OHID-1.zip" \
  "OHID‑1 hyperspectral dataset (10 scenes, ~1–2 GB)"

# -----------------------------------------------------------------------------
# 4) SegFly (Hugging Face) – using `hf`
# -----------------------------------------------------------------------------
log "=== 4) SegFly RGB & RGB‑T (Hugging Face) ==="
ensure_hf

mkdir -p rgb_thermal/SegFly

# -----------------------------------------------------------------------------
# 4) SegFly (Hugging Face) – using `hf` (no --resume-download)
# -----------------------------------------------------------------------------
log "=== 4) SegFly RGB & RGB‑T (Hugging Face) ==="
ensure_hf

mkdir -p rgb_thermal/SegFly

log "Downloading SegFly dataset via hf..."
# Resume is automatic; just re-run if interrupted.
hf download \
  --repo-type dataset \
  markus-42/SegFly \
  --local-dir rgb_thermal/SegFly

log "SegFly download complete."
echo ""

# -----------------------------------------------------------------------------
# 5) DroneVehicle (Hugging Face) – using `hf` (no --resume-download)
# -----------------------------------------------------------------------------
log "=== 5) DroneVehicle RGB‑LWIR (Hugging Face) ==="
ensure_hf

mkdir -p rgb_thermal/DroneVehicle

log "Downloading DroneVehicle dataset via hf..."
hf download \
  --repo-type dataset \
  McCheng/DroneVehicle \
  --local-dir rgb_thermal/DroneVehicle

log "DroneVehicle download complete."
echo ""

# -----------------------------------------------------------------------------
# 6) G‑LiHT (NASA) – example tile (extend as needed)
# -----------------------------------------------------------------------------
log "=== 6) G‑LiHT (NASA) – Example Tile ==="
mkdir -p airborne/GLiHT

# Example: one hyperspectral tile (you can add more by copying URLs from the G‑LiHT webmap)
# Replace this URL with any tile you want from:
#   https://glihtdata.gsfc.nasa.gov/files/G-LiHT/
#
# Here we use a placeholder; if this exact file is moved, update the URL.
EXAMPLE_GLiht_URL="https://glihtdata.gsfc.nasa.gov/files/G-LiHT/Alaska_2014/AL14_20140709_194915_194915_hyperspectral.tif"
EXAMPLE_GLiht_FILE="AL14_20140709_194915_194915_hyperspectral.tif"

log "Downloading example G‑LiHT hyperspectral tile (you can add more tiles manually)..."
if curl -sI "$EXAMPLE_GLiht_URL" | grep -q "200 OK"; then
  download \
    "$EXAMPLE_GLiht_URL" \
    "airborne/GLiHT/$EXAMPLE_GLiht_FILE" \
    "G‑LiHT example hyperspectral tile"
else
  log "Example G‑LiHT tile not found at this URL. Please:"
  log "  1) Open https://glihtdata.gsfc.nasa.gov"
  log "  2) Choose a region & tile with HS + thermal + LiDAR"
  log "  3) Copy the direct file URL"
  log "  4) Add a download line like:"
  log "     download \"<copied_url>\" \"airborne/GLiHT/<filename>\" \"G‑LiHT tile\""
fi
echo ""

# -----------------------------------------------------------------------------
# 7) STARCOP (EnMAP methane plume segmentation)
# -----------------------------------------------------------------------------
log "=== 7) STARCOP (EnMAP Hyperspectral Segmentation) ==="
mkdir -p hyperspectral/STARCOP

# STARCOP data is typically on Zenodo. Here is a representative direct link pattern.
# If this specific asset changes, update the URL from the Zenodo record.
STARCOP_ZENODO_URL="https://zenodo.org/record/7366667/files/STARCOP_data_v1.zip"  # example pattern

log "Attempting to download STARCOP (Zenodo)..."
if curl -sI "$STARCOP_ZENODO_URL" | grep -q "200 OK"; then
  download \
    "$STARCOP_ZENODO_URL" \
    "hyperspectral/STARCOP/STARCOP_data_v1.zip" \
    "STARCOP EnMAP hyperspectral segmentation dataset"
else
  log "STARCOP Zenodo link may have changed. Please:"
  log "  1) Open https://starcop.github.io"
  log "  2) Follow links to Zenodo / GitHub releases"
  log "  3) Copy the direct .zip link"
  log "  4) Add a download line like:"
  log "     download \"<zenodo_direct_link>\" \"hyperspectral/STARCOP/<file>\" \"STARCOP data\""
fi
echo ""

# -----------------------------------------------------------------------------
# 8) AeroRIT (aerial hyperspectral scene dataset)
# -----------------------------------------------------------------------------
log "=== 8) AeroRIT (Aerial Hyperspectral Scenes) ==="
mkdir -p hyperspectral/AeroRIT

# Example direct .mat link (if available); update if authors change hosting.
AeroRIT_URL="https://rit-lambda.github.io/AeroRIT/data/AeroRIT.mat"  # example pattern

log "Attempting to download AeroRIT..."
if curl -sI "$AeroRIT_URL" | grep -q "200 OK"; then
  download \
    "$AeroRIT_URL" \
    "hyperspectral/AeroRIT/AeroRIT.mat" \
    "AeroRIT hyperspectral scene dataset"
else
  log "AeroRIT direct link may have changed. Please:"
  log "  1) Open https://rit-lambda.github.io/AeroRIT/"
  log "  2) Use the listed .mat / .tiff links"
  log "  3) Add curl lines like:"
  log "     download \"<direct_link_to_AeroRIT_mat>\" \"hyperspectral/AeroRIT/<file>\" \"AeroRIT scene\""
fi
echo ""

# -----------------------------------------------------------------------------
# 9) Statistics of Real‑World Hyperspectral Images (indoor/outdoor)
# -----------------------------------------------------------------------------
log "=== 9) Statistics of Real‑World Hyperspectral Images (MIT) ==="
mkdir -p hyperspectral/indoor_realworld

# Project page: https://people.csail.mit.edu/ayan/hyperspectral/
# Example scene (update if links change):
MIT_HS_BASE="https://people.csail.mit.edu/ayan/hyperspectral/data"
MIT_HS_SCENE1="$MIT_HS_BASE/scene1.mat"  # example pattern

log "Attempting to download MIT indoor/outdoor HS scenes..."
if curl -sI "$MIT_HS_SCENE1" | grep -q "200 OK"; then
  download \
    "$MIT_HS_SCENE1" \
    "hyperspectral/indoor_realworld/scene1.mat" \
    "MIT real‑world HS scene 1"
  # Add more scenes similarly if you want:
  # download "$MIT_HS_BASE/scene2.mat" "hyperspectral/indoor_realworld/scene2.mat" "MIT scene 2"
else
  log "MIT HS scene link may have changed. Please:"
  log "  1) Open https://people.csail.mit.edu/ayan/hyperspectral/"
  log "  2) Download each .mat scene with curl, e.g.:"
  log "     download \"<direct_link_scene1.mat>\" \"hyperspectral/indoor_realworld/scene1.mat\" \"Scene 1\""
fi
echo ""

# -----------------------------------------------------------------------------
# 10) HyperSpectral Salient Object Detection Dataset
# -----------------------------------------------------------------------------
log "=== 10) HyperSpectral Salient Object Detection Dataset ==="
mkdir -p hyperspectral/salient

# Example project / GitHub link (update if authors change hosting).
SALIENT_HS_URL="https://github.com/.../salient_hs_dataset.zip"  # placeholder

log "Attempting to download HyperSpectral Salient Object Detection dataset..."
if curl -sI "$SALIENT_HS_URL" | grep -q "200 OK"; then
  download \
    "$SALIENT_HS_URL" \
    "hyperspectral/salient/salient_hs.zip" \
    "HyperSpectral Salient Object Detection dataset"
else
  log "Salient HS dataset link may have changed. Please:"
  log "  1) Open the project / GitHub page (search: 'HyperSpectral Salient Object Detection Dataset')"
  log "  2) Use the provided zip / .mat links with curl, e.g.:"
  log "     download \"<direct_link>\" \"hyperspectral/salient/salient_hs.zip\" \"Salient HS dataset\""
fi
echo ""

# -----------------------------------------------------------------------------
# 11) Multi‑spectral motion dataset (RGB + LWIR + depth)
# -----------------------------------------------------------------------------
log "=== 11) Multi‑spectral Motion Dataset (RGB + LWIR + Depth) ==="
mkdir -p multimodal/multi_spectral_motion

# GitHub: https://github.com/NGCLAB/multi-spectral-dataset
# Authors often host data on a separate server; use their provided link.
MULTI_SPEC_URL="https://example.com/multi_spectral_motion.zip"  # placeholder

log "Attempting to download multi‑spectral motion dataset..."
if curl -sI "$MULTI_SPEC_URL" | grep -q "200 OK"; then
  download \
    "$MULTI_SPEC_URL" \
    "multimodal/multi_spectral_motion/multi_spectral_motion.zip" \
    "Multi‑spectral motion dataset (RGB + LWIR + depth)"
else
  log "Multi‑spectral motion dataset link may have changed. Please:"
  log "  1) Open https://github.com/NGCLAB/multi-spectral-dataset"
  log "  2) Follow the download instructions (often a separate server link)"
  log "  3) Add curl lines like:"
  log "     download \"<direct_link>\" \"multimodal/multi_spectral_motion/<file>\" \"Multi‑spectral motion data\""
fi
echo ""

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
log "=== All Downloads Finished ==="
log "Root directory: $(pwd)"
log ""
log "Downloaded (direct + HF):"
log "  - Hyperspectral classic: Salinas, Indian Pines, PaviaU"
log "  - Kust4K RGB‑TIR segmentation (Figshare)"
log "  - OHID‑1 hyperspectral (Figshare)"
log "  - SegFly RGB & RGB‑T (Hugging Face)"
log "  - DroneVehicle RGB‑LWIR (Hugging Face)"
log "  - G‑LiHT (example tile, if available)"
log "  - STARCOP, AeroRIT, indoor HS, salient HS, multi‑spectral motion (if links valid)"
log ""
log "Estimated sizes (approximate):"
log "  - Classic HS: ~60–80 MB"
log "  - Kust4K: ~2.6 GB"
log "  - OHID‑1: ~1–2 GB"
log "  - SegFly: tens of GB (full)"
log "  - DroneVehicle: ~10–20 GB (full)"
log "  - G‑LiHT + others: varies, can be tens of GB"
log ""
log "If some datasets show placeholder messages, open the linked project pages"
log "and replace the example URLs in this script with the current direct links."
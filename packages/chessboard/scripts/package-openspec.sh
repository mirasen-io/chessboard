#!/usr/bin/env bash
set -euo pipefail

# Packages OpenSpec content for ChatGPT review.
#
# Usage:
#   ./scripts/package-openspec.sh
#       Pack openspec/specs/ + all openspec/changes/* except archive/.
#
#   ./scripts/package-openspec.sh <dirname>
#       Pack exactly openspec/<dirname>/.
#       <dirname> may be nested, e.g. "changes/my-change".
#
# Output:
#   ./artifacts/<prefix>-YYYYMMDD-HHMMSS.tgz

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ARTIFACTS_DIR="$ROOT_DIR/artifacts"
STAGING_DIR="$ARTIFACTS_DIR/.openspec-staging"
OPENSPEC_DIR="$ROOT_DIR/openspec"

TIMESTAMP="$(date +"%Y%m%d-%H%M%S")"

if [[ ! -d "$OPENSPEC_DIR" ]]; then
  echo "Error: openspec directory not found at $OPENSPEC_DIR"
  exit 1
fi

usage() {
  echo "Usage: $0 [<dirname-inside-openspec>]"
  exit 1
}

sanitize() {
  local s="$1"
  s="${s//\//-}"
  s="$(echo "$s" | sed -E 's/^-+//; s/-+$//')"
  echo "$s"
}

MODE="all"
TARGET=""
NAME_PREFIX="chessboard-openspec"

if [[ $# -gt 1 ]]; then
  usage
elif [[ $# -eq 1 ]]; then
  MODE="single"
  TARGET="$1"
  if [[ ! -d "$OPENSPEC_DIR/$TARGET" ]]; then
    echo "Error: openspec/$TARGET is not a directory"
    exit 1
  fi
  NAME_PREFIX="chessboard-openspec-$(sanitize "$TARGET")"
fi

ARCHIVE_NAME="${NAME_PREFIX}-${TIMESTAMP}.tgz"
ARCHIVE_PATH="$ARTIFACTS_DIR/$ARCHIVE_NAME"

rm -rf "$STAGING_DIR"
mkdir -p "$STAGING_DIR"
mkdir -p "$ARTIFACTS_DIR"

echo "Preparing OpenSpec package..."
echo "Mode: $MODE${TARGET:+ ($TARGET)}"

if [[ "$MODE" == "all" ]]; then
  mkdir -p "$STAGING_DIR/openspec"

  if [[ -d "$OPENSPEC_DIR/specs" ]]; then
    cp -R "$OPENSPEC_DIR/specs" "$STAGING_DIR/openspec/specs"
  fi

  if [[ -d "$OPENSPEC_DIR/changes" ]]; then
    mkdir -p "$STAGING_DIR/openspec/changes"
    shopt -s nullglob
    for entry in "$OPENSPEC_DIR/changes"/*; do
      name="$(basename "$entry")"
      if [[ "$name" == "archive" ]]; then
        continue
      fi
      cp -R "$entry" "$STAGING_DIR/openspec/changes/$name"
    done
    shopt -u nullglob
  fi
else
  parent_rel="$(dirname "openspec/$TARGET")"
  mkdir -p "$STAGING_DIR/$parent_rel"
  cp -R "$OPENSPEC_DIR/$TARGET" "$STAGING_DIR/openspec/$TARGET"
fi

# Strip macOS noise.
find "$STAGING_DIR" \( \
  -name '.DS_Store' -o \
  -name '._*' -o \
  -name 'Icon?' -o \
  -name '.apdisk' \
\) -type f -delete
find "$STAGING_DIR" -type d \( \
  -name '.AppleDouble' -o \
  -name '.Spotlight-V100' -o \
  -name '.Trashes' -o \
  -name '.fseventsd' -o \
  -name '.TemporaryItems' -o \
  -name '__MACOSX' \
\) -prune -exec rm -rf {} +

# Bail out if nothing was staged (e.g. only archive existed).
if [[ -z "$(find "$STAGING_DIR" -mindepth 1 -type f -print -quit)" ]]; then
  echo "Error: nothing to package (staging is empty)"
  rm -rf "$STAGING_DIR"
  exit 1
fi

{
  echo "Included OpenSpec tree:"
  echo
  if command -v tree >/dev/null 2>&1; then
    tree "$STAGING_DIR"
  else
    (
      cd "$STAGING_DIR"
      find . | sort
    )
  fi
} > "$STAGING_DIR/TREE.txt"

(
  cd "$STAGING_DIR"
  tar -czf "$ARCHIVE_PATH" .
)

rm -rf "$STAGING_DIR"

echo
echo "Archive created:"
echo "  $ARCHIVE_PATH"

open "$ARTIFACTS_DIR"

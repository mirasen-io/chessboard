#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ARTIFACTS_DIR="$ROOT_DIR/artifacts"
mkdir -p "$ARTIFACTS_DIR"
TIMESTAMP="$(date +"%Y%m%d-%H%M%S")"
OUTPUT_NAME="$ARTIFACTS_DIR/git-${TIMESTAMP}.diff"

git add -N .
git diff . ':(exclude)package-lock.json' > "$OUTPUT_NAME"
open "$ARTIFACTS_DIR"

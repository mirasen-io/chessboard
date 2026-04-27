#!/usr/bin/env bash
set -euo pipefail

# Packages project source for ChatGPT code review.
#
# Usage:
#   ./scripts/package-review-src.sh
#   ./scripts/package-review-src.sh --full
#   ./scripts/package-review-src.sh my-prefix
#   ./scripts/package-review-src.sh my-prefix --full
#
# Output:
#   ./artifacts/<name>-YYYYMMDD-HHMMSS.tgz

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ARTIFACTS_DIR="$ROOT_DIR/artifacts"
STAGING_DIR="$ARTIFACTS_DIR/.review-src-staging"

TIMESTAMP="$(date +"%Y%m%d-%H%M%S")"
NAME_PREFIX="chessboard-src-review"
FULL_MODE="false"

for arg in "$@"; do
  case "$arg" in
    --full)
      FULL_MODE="true"
      ;;
    *)
      NAME_PREFIX="$arg"
      ;;
  esac
done

ARCHIVE_NAME="${NAME_PREFIX}-${TIMESTAMP}.tgz"
ARCHIVE_PATH="$ARTIFACTS_DIR/$ARCHIVE_NAME"

rm -rf "$STAGING_DIR"
mkdir -p "$STAGING_DIR"
mkdir -p "$ARTIFACTS_DIR"

copy_if_exists() {
  local path="$1"
  if [[ -e "$ROOT_DIR/$path" ]]; then
    mkdir -p "$STAGING_DIR/$(dirname "$path")"
    cp -R "$ROOT_DIR/$path" "$STAGING_DIR/$path"
  fi
}

echo "Preparing review package..."
echo "Mode: $([[ "$FULL_MODE" == "true" ]] && echo full || echo standard)"

if [[ ! -d "$ROOT_DIR/src" ]]; then
  echo "Error: src directory not found"
  exit 1
fi

# Standard payload
cp -R "$ROOT_DIR/src" "$STAGING_DIR/src"
copy_if_exists "tests"
copy_if_exists "scripts"

copy_if_exists "src-old"
copy_if_exists "tests-old"

copy_if_exists "package.json"
copy_if_exists "package-lock.json"
copy_if_exists "pnpm-lock.yaml"
copy_if_exists "yarn.lock"

copy_if_exists "tsconfig.json"
copy_if_exists "tsconfig-test.json"
copy_if_exists "tsconfig-release.json"

copy_if_exists "vite.config.ts"
copy_if_exists "vitest.config.ts"

copy_if_exists "README.md"
copy_if_exists ".npmignore"

# Optional extras in full mode
if [[ "$FULL_MODE" == "true" ]]; then
  copy_if_exists "scripts"
  copy_if_exists "examples"
  copy_if_exists "docs"
  copy_if_exists ".github"
  copy_if_exists "CHANGELOG.md"
fi

find "$STAGING_DIR" -type d \( \
  -path "$STAGING_DIR/node_modules" -o \
  -path "$STAGING_DIR/dist" -o \
  -path "$STAGING_DIR/build" -o \
  -path "$STAGING_DIR/coverage" -o \
  -path "$STAGING_DIR/.git" \
\) -prune -exec rm -rf {} +

{
  echo "Included project tree:"
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

cat > "$STAGING_DIR/REVIEW_NOTES.txt" <<'EOF'
Suggested prompt when uploading this archive:

Need a full review of this npm chessboard package source.

Focus:
- architecture
- public API
- renderer/state boundaries
- drag-and-drop readiness
- extension model
- TypeScript quality
- package readiness

Less important:
- visual polish
- tests
- docs wording

Please provide:
1. high-level architectural review
2. critical issues
3. medium issues
4. recommended priority order
EOF

(
  cd "$STAGING_DIR"
  tar -czf "$ARCHIVE_PATH" .
)

rm -rf "$STAGING_DIR"

echo
echo "Archive created:"
echo "  $ARCHIVE_PATH"

open "$ARTIFACTS_DIR"

#!/usr/bin/env bash
set -euo pipefail

# Packages project source for ChatGPT code review.
#
# Copies everything git would consider part of the project (tracked files +
# untracked files that aren't ignored), honoring all nested .gitignore rules
# via `git ls-files`. Reusable across repos without per-project tweaks.
# Must be run inside a git repo.
#
# Usage:
#   ./scripts/package-review-src.sh
#   ./scripts/package-review-src.sh my-prefix
#
# Output:
#   ./artifacts/<name>-YYYYMMDD-HHMMSS.tgz

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ARTIFACTS_DIR="$ROOT_DIR/artifacts"
STAGING_DIR="$ARTIFACTS_DIR/.review-src-staging"

TIMESTAMP="$(date +"%Y%m%d-%H%M%S")"
NAME_PREFIX="${1:-chessboard-src-review}"

ARCHIVE_NAME="${NAME_PREFIX}-${TIMESTAMP}.tgz"
ARCHIVE_PATH="$ARTIFACTS_DIR/$ARCHIVE_NAME"

rm -rf "$STAGING_DIR"
mkdir -p "$STAGING_DIR"
mkdir -p "$ARTIFACTS_DIR"

echo "Preparing review package..."

# Copy everything git tracks plus untracked-but-not-ignored files. This honors
# all (nested) .gitignore rules without maintaining a per-project allowlist.
# `git ls-files --cached` reports paths from the index, which can include files
# that were deleted on disk but not yet staged — skip those, the archive should
# reflect the working tree, not the index.
while IFS= read -r -d '' f; do
  [[ -e "$ROOT_DIR/$f" ]] || continue
  mkdir -p "$STAGING_DIR/$(dirname "$f")"
  cp "$ROOT_DIR/$f" "$STAGING_DIR/$f"
done < <(git -C "$ROOT_DIR" ls-files -z --cached --others --exclude-standard)

# Paths to strip from the staged tree, on top of .gitignore. Each entry is
# matched against the basename at any depth (i.e. `**/<entry>`) and removed
# recursively, so the same list works for files and directories. Glob chars
# (`*`, `?`) are passed through to find.
EXTRA_EXCLUDES=(
  # Lockfiles — noisy, useless for review.
  'package-lock.json'
  'yarn.lock'
  'pnpm-lock.yaml'
  'bun.lockb'

  # AI / IDE assistant configs.
  '.claude'
  '.cursor'
  '.aider*'
  '.windsurf'
  '.continue'

  # Release / process metadata, not code.
  'CHANGELOG.md'
  'LICENSE'

  # macOS filesystem noise.
  '.DS_Store'
  '._*'
  'Icon?'
  '.apdisk'
  '.AppleDouble'
  '.Spotlight-V100'
  '.Trashes'
  '.fseventsd'
  '.TemporaryItems'
  '__MACOSX'
)

# Optional excludes — uncomment per task when these aren't relevant to the
# review (e.g. you're reviewing application code, not CI/release plumbing).
# EXTRA_EXCLUDES+=(
#   '.changeset'
#   'openspec'
#   '.github'
#   '.githooks'
#   '__snapshots__'
#   '.vscode'
#   '.idea'
#   '.editorconfig'
#   '.prettierrc'
#   '.prettierignore'
#   '.npmrc'
#   '.nvmrc'
#   '.sonarcloud.properties'
#   'sonar-project.properties'
# )

for pattern in "${EXTRA_EXCLUDES[@]}"; do
  find "$STAGING_DIR" -depth -name "$pattern" -exec rm -rf {} +
done

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

(
  cd "$STAGING_DIR"
  tar -czf "$ARCHIVE_PATH" .
)

rm -rf "$STAGING_DIR"

echo
echo "Archive created:"
echo "  $ARCHIVE_PATH"

open "$ARTIFACTS_DIR"

#!/bin/bash
set -euo pipefail

# Check that there are no uncommitted changes in the current branch
if [[ -n $(git status --porcelain) ]]; then
  echo "Error: There are uncommitted changes in the current branch. Please commit or stash them before running this script."
  exit 1
fi

git fetch origin
git checkout contribution
git reset --hard origin/contribution
git status

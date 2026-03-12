#!/bin/bash
TIMESTAMP="$(date +"%Y%m%d-%H%M%S")"
OUTPUT_NAME="artifacts/git-${TIMESTAMP}.diff"
git add .
git diff --staged -- . ':(exclude)package-lock.json' > "$OUTPUT_NAME"

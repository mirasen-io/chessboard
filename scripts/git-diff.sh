#!/bin/bash
TIMESTAMP="$(date +"%Y%m%d-%H%M%S")"
OUTPUT_NAME="artifacts/git-${TIMESTAMP}.diff"
git add -N .
git diff . ':(exclude)package-lock.json' > "$OUTPUT_NAME"

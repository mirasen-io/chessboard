#!/bin/bash
TIMESTAMP="$(date +"%Y%m%d-%H%M%S")"
OUTPUT_NAME="artifacts/test-${TIMESTAMP}.log"
npm test 2>&1 | tee "$OUTPUT_NAME"

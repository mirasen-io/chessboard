#!/bin/bash
git add .
git diff --staged -- . ':(exclude)package-lock.json' > artifacts/git.diff

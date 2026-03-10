#!/bin/bash
git diff --staged -- . ':(exclude)package-lock.json' > artifacts/git.diff

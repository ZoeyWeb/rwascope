#!/bin/bash
git add .
git commit -m "${1:-Update}"
git push
./scripts/deploy.sh

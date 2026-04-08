#!/usr/bin/env bash

set -euo pipefail

ENVIRONMENT="${1:-}"

case "$ENVIRONMENT" in
  staging)
    TARGET_DIR="/www/wwwroot/testflowgrok.plxeditor.com"
    ;;
  prod)
    TARGET_DIR="/www/wwwroot/flowgrok.plxeditor.com"
    ;;
  *)
    echo "Usage: $0 <staging|prod>"
    exit 1
    ;;
esac

if ! command -v rsync >/dev/null 2>&1; then
  echo "rsync is required."
  exit 1
fi

npm run build

if [[ ! -d "dist" ]]; then
  echo "Build output dist/ was not created."
  exit 1
fi

if [[ ! -w "$TARGET_DIR" ]]; then
  echo "Target directory is not writable: $TARGET_DIR"
  echo "Current user: $(id -un)"
  echo "Fix ownership or ACL before deploying."
  exit 1
fi

mkdir -p "$TARGET_DIR"
rsync -rlvz --delete \
  --omit-dir-times \
  --no-perms \
  --no-owner \
  --no-group \
  dist/ "$TARGET_DIR"/

echo "Deployed frontend build to $TARGET_DIR"

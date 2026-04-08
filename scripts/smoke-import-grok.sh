#!/usr/bin/env bash

set -euo pipefail

TOKEN="${TOKEN:-}"
PROFILE_ID="${PROFILE_ID:-}"
FILE_PATH="${FILE_PATH:-}"
SOURCE_TYPE="${SOURCE_TYPE:-storage_state_json}"
BASE_URL="${BASE_URL:-https://flowgrok.plxeditor.com}"

if [[ -z "$TOKEN" || -z "$PROFILE_ID" || -z "$FILE_PATH" ]]; then
  cat <<'EOF'
Usage:
  TOKEN="..." PROFILE_ID="..." FILE_PATH="/abs/path/to/file.json" ./scripts/smoke-import-grok.sh

Optional env:
  SOURCE_TYPE=storage_state_json|json|txt
  BASE_URL=https://flowgrok.plxeditor.com
EOF
  exit 1
fi

if [[ ! -f "$FILE_PATH" ]]; then
  echo "File not found: $FILE_PATH"
  exit 1
fi

if [[ "$SOURCE_TYPE" != "storage_state_json" && "$SOURCE_TYPE" != "json" && "$SOURCE_TYPE" != "txt" ]]; then
  echo "Unsupported SOURCE_TYPE: $SOURCE_TYPE"
  exit 1
fi

IMPORT_URL="${BASE_URL}/api/v1/profiles/${PROFILE_ID}/cookies/import"
TEST_LOGIN_URL="${BASE_URL}/api/v1/profiles/${PROFILE_ID}/test-login"

echo "Importing file into profile: $PROFILE_ID"
echo "Base URL: $BASE_URL"
echo "Source type: $SOURCE_TYPE"
echo "File: $FILE_PATH"
echo

IMPORT_RESPONSE="$(
  curl -sS -X POST "$IMPORT_URL" \
    -H "Authorization: Bearer ${TOKEN}" \
    -F "source_type=${SOURCE_TYPE}" \
    -F "file=@${FILE_PATH}"
)"

echo "Import response:"
printf '%s\n' "$IMPORT_RESPONSE" | jq .
echo

echo "Running test-login..."
TEST_LOGIN_RESPONSE="$(
  curl -sS -X POST "$TEST_LOGIN_URL" \
    -H "Authorization: Bearer ${TOKEN}"
)"

echo "Test-login response:"
printf '%s\n' "$TEST_LOGIN_RESPONSE" | jq .

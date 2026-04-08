#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:-https://flowgrok.plxeditor.com}"
EMAIL="${EMAIL:-smoke.$(date +%s)@flowgrok.local}"
PASSWORD="${PASSWORD:-SmokeTest123!}"
PROFILE_NAME="${PROFILE_NAME:-Smoke Grok Profile}"
PROFILE_CATEGORY="${PROFILE_CATEGORY:-grok}"
FILE_PATH="${FILE_PATH:-}"
SOURCE_TYPE="${SOURCE_TYPE:-storage_state_json}"

if [[ -z "$FILE_PATH" ]]; then
  cat <<'EOF'
Usage:
  FILE_PATH="/abs/path/to/file.json" ./scripts/full-grok-smoke.sh

Optional env:
  BASE_URL=https://flowgrok.plxeditor.com
  EMAIL=smoke.example@flowgrok.local
  PASSWORD=SmokeTest123!
  PROFILE_NAME=Smoke Grok Profile
  PROFILE_CATEGORY=grok
  SOURCE_TYPE=storage_state_json|json|txt
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

REGISTER_URL="${BASE_URL}/api/v1/auth/register"
LOGIN_URL="${BASE_URL}/api/v1/auth/login"
PROFILE_URL="${BASE_URL}/api/v1/profiles/"

echo "Running full Grok smoke flow..."
echo "Base URL: $BASE_URL"
echo "Email: $EMAIL"
echo "Profile name: $PROFILE_NAME"
echo "Profile category: $PROFILE_CATEGORY"
echo "Source type: $SOURCE_TYPE"
echo "File: $FILE_PATH"
echo

REGISTER_RESPONSE="$(
  curl -sS -X POST "$REGISTER_URL" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}"
)"

LOGIN_RESPONSE="$(
  curl -sS -X POST "$LOGIN_URL" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}"
)"

TOKEN="$(printf '%s\n' "$LOGIN_RESPONSE" | jq -r '.access_token')"

if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  echo "Could not obtain access token."
  echo "Register response:"
  printf '%s\n' "$REGISTER_RESPONSE" | jq .
  echo "Login response:"
  printf '%s\n' "$LOGIN_RESPONSE" | jq .
  exit 1
fi

PROFILE_RESPONSE="$(
  curl -sS -X POST "$PROFILE_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -d "{\"name\":\"${PROFILE_NAME}\",\"category\":\"${PROFILE_CATEGORY}\",\"cookies_json\":null,\"antidetect_settings\":{\"user_agent\":\"Mozilla/5.0\"}}"
)"

PROFILE_ID="$(printf '%s\n' "$PROFILE_RESPONSE" | jq -r '.id')"

if [[ -z "$PROFILE_ID" || "$PROFILE_ID" == "null" ]]; then
  echo "Could not create profile."
  echo "Profile response:"
  printf '%s\n' "$PROFILE_RESPONSE" | jq .
  exit 1
fi

IMPORT_RESPONSE="$(
  curl -sS -X POST "${BASE_URL}/api/v1/profiles/${PROFILE_ID}/cookies/import" \
    -H "Authorization: Bearer ${TOKEN}" \
    -F "source_type=${SOURCE_TYPE}" \
    -F "file=@${FILE_PATH}"
)"

TEST_LOGIN_RESPONSE="$(
  curl -sS -X POST "${BASE_URL}/api/v1/profiles/${PROFILE_ID}/test-login" \
    -H "Authorization: Bearer ${TOKEN}"
)"

echo "Register response:"
printf '%s\n' "$REGISTER_RESPONSE" | jq .
echo
echo "Profile response:"
printf '%s\n' "$PROFILE_RESPONSE" | jq .
echo
echo "Import response:"
printf '%s\n' "$IMPORT_RESPONSE" | jq .
echo
echo "Test-login response:"
printf '%s\n' "$TEST_LOGIN_RESPONSE" | jq .
echo
echo "Summary:"
echo "EMAIL=\"$EMAIL\""
echo "PASSWORD=\"$PASSWORD\""
echo "TOKEN=\"$TOKEN\""
echo "PROFILE_ID=\"$PROFILE_ID\""

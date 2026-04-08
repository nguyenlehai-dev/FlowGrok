#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:-https://flowgrok.plxeditor.com}"
EMAIL="${EMAIL:-smoke.$(date +%s)@flowgrok.local}"
PASSWORD="${PASSWORD:-SmokeTest123!}"
PROFILE_NAME="${PROFILE_NAME:-Smoke Grok Profile}"
PROFILE_CATEGORY="${PROFILE_CATEGORY:-grok}"

REGISTER_URL="${BASE_URL}/api/v1/auth/register"
LOGIN_URL="${BASE_URL}/api/v1/auth/login"
PROFILE_URL="${BASE_URL}/api/v1/profiles/"

echo "Creating smoke user and profile..."
echo "Base URL: $BASE_URL"
echo "Email: $EMAIL"
echo "Profile name: $PROFILE_NAME"
echo "Profile category: $PROFILE_CATEGORY"
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

echo "Register response:"
printf '%s\n' "$REGISTER_RESPONSE" | jq .
echo
echo "Profile response:"
printf '%s\n' "$PROFILE_RESPONSE" | jq .
echo
echo "Ready to use:"
echo "EMAIL=\"$EMAIL\""
echo "PASSWORD=\"$PASSWORD\""
echo "TOKEN=\"$TOKEN\""
echo "PROFILE_ID=\"$PROFILE_ID\""
echo
echo "Next step example:"
cat <<EOF
TOKEN="$TOKEN" \\
PROFILE_ID="$PROFILE_ID" \\
FILE_PATH="/home/vpsroot/projects/frontend/FlowGrok/docs/testing/samples/grok-storage-state.sample.json" \\
./scripts/smoke-import-grok.sh
EOF

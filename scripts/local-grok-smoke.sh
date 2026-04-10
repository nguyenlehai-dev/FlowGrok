#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

FILE_PATH="${FILE_PATH:-}"
BASE_URL="${BASE_URL:-http://127.0.0.1:8080}"
FRONTEND_URL="${FRONTEND_URL:-http://127.0.0.1:5173}"
EMAIL="${EMAIL:-smoke.$(date +%s)@flowgrok.local}"
PASSWORD="${PASSWORD:-SmokeTest123!}"
PROFILE_NAME="${PROFILE_NAME:-Local Grok Smoke}"
PROFILE_CATEGORY="${PROFILE_CATEGORY:-grok}"
SOURCE_TYPE="${SOURCE_TYPE:-storage_state_json}"

if [[ -z "$FILE_PATH" ]]; then
  cat <<'EOF'
Usage:
  FILE_PATH="/abs/path/to/storage_state.json" ./scripts/local-grok-smoke.sh

Optional env:
  BASE_URL=http://127.0.0.1:8080
  FRONTEND_URL=http://127.0.0.1:5173
  EMAIL=smoke.local@flowgrok.local
  PASSWORD=SmokeTest123!
  PROFILE_NAME=Local Grok Smoke
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

echo "Checking local backend..."
if ! curl -fsS "${BASE_URL}/api/health" >/dev/null; then
  cat <<EOF
Local backend is not reachable at ${BASE_URL}.

Start backend first:
  cd /home/vpsroot/projects/backend/-FlowGrok-BE
  cp .env.example .env
  docker compose --profile postgres up -d

Then rerun:
  FILE_PATH="${FILE_PATH}" ./scripts/local-grok-smoke.sh
EOF
  exit 1
fi

echo "Running full Grok smoke against local backend..."
BASE_URL="$BASE_URL" \
EMAIL="$EMAIL" \
PASSWORD="$PASSWORD" \
PROFILE_NAME="$PROFILE_NAME" \
PROFILE_CATEGORY="$PROFILE_CATEGORY" \
FILE_PATH="$FILE_PATH" \
SOURCE_TYPE="$SOURCE_TYPE" \
./scripts/full-grok-smoke.sh

cat <<EOF

Next local UI steps:
1. Start frontend if it is not running:
   cd /home/vpsroot/projects/frontend/FlowGrok
   npm install
   npm run dev

2. Open:
   ${FRONTEND_URL}

3. Login with the smoke account printed above.

4. Go to API Keys, create a key, copy it.

5. In the header, open System Auth:
   - API Base URL: /api/v1
   - Gateway API Key: paste the key
   - Click Verify

6. Open Profiles or API Docs.

7. If test-login passed, queue:
   - generate_image
   - generate_video

Expected note:
- If Grok still shows "Just a moment..." in test-login, local Cloudflare is still blocking this session.
- If test-login passes, local worker has a much better chance of generating successfully than the server environment.
EOF

#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:3001/api}"

health_status=$(curl -s -o /tmp/aircraft-health.json -w "%{http_code}" "$API_URL/health")
if [[ "$health_status" != "200" ]]; then
  echo "Health check failed with status: $health_status"
  cat /tmp/aircraft-health.json
  exit 1
fi

login_response=$(curl -s -X POST "$API_URL/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"internal@beta.example","password":"internal123"}')

token=$(echo "$login_response" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d.token||'')")
if [[ -z "$token" ]]; then
  echo "Login smoke failed"
  echo "$login_response"
  exit 1
fi

aircraft_status=$(curl -s -o /tmp/aircraft-list.json -w "%{http_code}" \
  "$API_URL/aircraft?page=1&pageSize=5" \
  -H "Authorization: Bearer $token")

if [[ "$aircraft_status" != "200" ]]; then
  echo "Aircraft list smoke failed with status: $aircraft_status"
  cat /tmp/aircraft-list.json
  exit 1
fi

echo "Smoke check passed: health, login, protected aircraft list"

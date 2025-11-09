#!/bin/sh
# Simple entrypoint that rewrites env-config.js with the runtime API origin
# before handing control back to nginx.
set -eu

TEMPLATE_PATH="/etc/nginx/templates/env-config.js.template"
TARGET_PATH="/usr/share/nginx/html/env-config.js"

# Allow callers to omit API_ORIGIN (useful for local dev containers).
API_ORIGIN_VALUE="${API_ORIGIN:-}"

if [ -z "$API_ORIGIN_VALUE" ]; then
  echo "API_ORIGIN not provided; defaulting to http://localhost:8080"
  API_ORIGIN_VALUE="http://localhost:8080"
fi

export API_ORIGIN="$API_ORIGIN_VALUE"

if [ ! -f "$TEMPLATE_PATH" ]; then
  echo "Runtime env template not found at $TEMPLATE_PATH" >&2
  exit 1
fi

# envsubst swaps the placeholder with the real value to keep the bundle static.
envsubst '$API_ORIGIN' < "$TEMPLATE_PATH" > "$TARGET_PATH"

exec "$@"

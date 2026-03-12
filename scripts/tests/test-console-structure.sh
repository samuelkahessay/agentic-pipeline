#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)

for path in \
  console/server.js \
  console/package.json \
  console/lib/orchestrator.js \
  console/lib/event-store.js \
  console/lib/preflight.js \
  console/routes/api-preflight.js \
  console/routes/api-run.js \
  console/routes/api-run-stream.js \
  console/routes/api-history.js \
  console/public/index.html \
  console/public/run.html \
  console/public/history.html \
  console/public/css/console.css \
  console/public/js/app.js \
  console/public/js/preflight.js \
  console/public/js/run-form.js \
  console/public/js/run-progress.js \
  console/public/js/history.js \
  console/data/.gitkeep; do
  [ -e "$ROOT_DIR/$path" ] || {
    echo "FAIL: missing console path $path" >&2
    exit 1
  }
done

grep -F 'console/' "$ROOT_DIR/scaffold/template-manifest.yml" >/dev/null || {
  echo "FAIL: console/ must be explicitly forbidden from scaffold export" >&2
  exit 1
}

echo "console structure tests passed"

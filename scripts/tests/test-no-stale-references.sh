#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/../.." && pwd)
ERRORS=0

# Template repo references are intentional in console provisioning, publication
# automation, and current docs. They should not leak into exported scaffold
# sources or local trigger scripts.
for file in scaffold/*.sh scaffold/template-manifest.yml trigger/*.sh README.template.md setup.sh setup-verify.sh; do
  filepath="$ROOT_DIR/$file"
  [ -f "$filepath" ] || continue
  if grep -qF "prd-to-prod-template" "$filepath"; then
    echo "STALE: $file contains reference to 'prd-to-prod-template'"
    ((ERRORS++))
  fi
done

# meeting-to-main references are stale in trigger/ and ARCHITECTURE.md
# but acceptable in internal historical docs
for pattern in "meeting-to-main"; do
  for file in scaffold/*.sh scaffold/template-manifest.yml trigger/*.sh docs/ARCHITECTURE.md README.template.md setup.sh setup-verify.sh; do
    filepath="$ROOT_DIR/$file"
    [ -f "$filepath" ] || continue
    if rg -n -P "${pattern}(?!:)" "$filepath" >/dev/null 2>&1; then
      echo "STALE: $file contains reference to '$pattern'"
      ((ERRORS++))
    fi
  done
done

if [ "$ERRORS" -gt 0 ]; then
  echo "FAIL: $ERRORS stale reference(s) found"
  exit 1
fi

echo "no-stale-references tests passed"

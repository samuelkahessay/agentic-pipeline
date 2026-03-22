#!/usr/bin/env bash
set -euo pipefail

OWNER="${GITHUB_OWNER:-samuelkahessay}"
REPO_PATTERN="${E2E_REPO_PATTERN:--e2e-}"
DRY_RUN=0
REPOS=()

usage() {
  cat <<'EOF'
Usage: disable-test-repo-workflows.sh [options]

Disable GitHub Actions and cancel active runs for temporary E2E repos.

Options:
  --owner LOGIN      GitHub owner to scan (default: samuelkahessay or $GITHUB_OWNER)
  --pattern TEXT     Repo-name substring to match (default: -e2e-)
  --repo OWNER/REPO  Disable a specific repo (may be passed multiple times)
  --dry-run          Print the repos that would be changed without mutating anything
  -h, --help         Show this help text
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --owner)
      OWNER="$2"
      shift 2
      ;;
    --pattern)
      REPO_PATTERN="$2"
      shift 2
      ;;
    --repo)
      REPOS+=("$2")
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

collect_matching_repos() {
  if [[ ${#REPOS[@]} -gt 0 ]]; then
    printf '%s\n' "${REPOS[@]}"
    return
  fi

  gh repo list "$OWNER" --limit 200 --json name,nameWithOwner --jq '.[] | [.name, .nameWithOwner] | @tsv' |
    while IFS=$'\t' read -r repo_name repo_with_owner; do
      if [[ "$repo_name" == *"$REPO_PATTERN"* ]]; then
        printf '%s\n' "$repo_with_owner"
      fi
    done
}

cancel_active_runs() {
  local repo="$1"
  local run_ids

  run_ids=$(gh run list \
    --repo "$repo" \
    --limit 100 \
    --json databaseId,status \
    --jq '.[] | select(.status == "queued" or .status == "in_progress") | .databaseId' \
    2>/dev/null || true)

  if [[ -z "$run_ids" ]]; then
    return
  fi

  while IFS= read -r run_id; do
    [[ -n "$run_id" ]] || continue
    if [[ "$DRY_RUN" -eq 1 ]]; then
      echo "DRY RUN: would cancel run $run_id in $repo"
      continue
    fi
    gh run cancel "$run_id" --repo "$repo" >/dev/null || true
    echo "Cancelled run $run_id in $repo"
  done <<< "$run_ids"
}

disable_actions() {
  local repo="$1"
  local enabled

  enabled=$(gh api "repos/$repo/actions/permissions" --jq '.enabled' 2>/dev/null || echo "unknown")
  cancel_active_runs "$repo"

  if [[ "$enabled" == "false" ]]; then
    echo "Already disabled: $repo"
    return
  fi

  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "DRY RUN: would disable Actions for $repo"
    return
  fi

  gh api --method PUT "repos/$repo/actions/permissions" -F enabled=false >/dev/null
  enabled=$(gh api "repos/$repo/actions/permissions" --jq '.enabled')

  if [[ "$enabled" != "false" ]]; then
    echo "Failed to disable Actions for $repo" >&2
    exit 1
  fi

  echo "Disabled Actions for $repo"
}

TARGET_REPOS=()
while IFS= read -r repo; do
  [[ -n "$repo" ]] || continue
  TARGET_REPOS+=("$repo")
done < <(collect_matching_repos)

if [[ ${#TARGET_REPOS[@]} -eq 0 ]]; then
  echo "No repositories matched pattern '$REPO_PATTERN' for owner '$OWNER'."
  exit 0
fi

for repo in "${TARGET_REPOS[@]}"; do
  disable_actions "$repo"
done

#!/usr/bin/env bash
set -euo pipefail

# Pull logs from the local DHIS2 docker containers into logs/*.log
# so they can be read by tooling (and agents) in the repo.
#
# Usage:
#   scripts/pull-logs.sh                # both containers, last 1000 lines
#   scripts/pull-logs.sh web            # only web
#   scripts/pull-logs.sh db 5000        # only db, last 5000 lines
#   scripts/pull-logs.sh all 0          # both, full history (can be large)

WEB_CONTAINER="${DHIS2_WEB_CONTAINER:-dhis2-cli-web-1}"
DB_CONTAINER="${DHIS2_DB_CONTAINER:-dhis2-cli-db-1}"

target="${1:-all}"
tail_count="${2:-1000}"

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
log_dir="$repo_root/logs"
mkdir -p "$log_dir"

dump() {
  local name="$1"
  local container="$2"
  local out="$log_dir/${name}.log"

  if ! docker inspect "$container" >/dev/null 2>&1; then
    echo "warn: container '$container' not found, skipping $name" >&2
    return 0
  fi

  local tail_arg=()
  if [[ "$tail_count" != "0" ]]; then
    tail_arg=(--tail "$tail_count")
  fi

  # Merge stdout+stderr, include timestamps, write atomically.
  local tmp="${out}.tmp"
  docker logs "${tail_arg[@]}" --timestamps "$container" >"$tmp" 2>&1
  mv "$tmp" "$out"
  echo "wrote $out ($(wc -l <"$out" | tr -d ' ') lines)"
}

case "$target" in
  web) dump web "$WEB_CONTAINER" ;;
  db)  dump db  "$DB_CONTAINER"  ;;
  all)
    dump web "$WEB_CONTAINER"
    dump db  "$DB_CONTAINER"
    ;;
  *)
    echo "usage: $0 [web|db|all] [tail-count]" >&2
    exit 1
    ;;
esac

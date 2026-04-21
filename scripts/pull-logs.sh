#!/usr/bin/env bash
set -euo pipefail

# Pull logs from the local DHIS2 docker containers into logs/*.log so they can
# be read by tooling (and agents) in the repo.
#
# Usage:
#   scripts/pull-logs.sh --web <id-or-name> --db <id-or-name> [--target web|db|all] [--tail N]
#
# Legacy/positional form (back-compat):
#   scripts/pull-logs.sh [web|db|all] [tail-count]
#
# Container IDs can be obtained from:
#   docker compose -f docker/docker-compose.yml ps --quiet web
#   docker compose -f docker/docker-compose.yml ps --quiet db
#
# Environment variables (used if the corresponding flag is not provided):
#   DHIS2_WEB_CONTAINER   (default: dhis2-mac-web-1)
#   DHIS2_DB_CONTAINER    (default: dhis2-mac-db-1)

web_container="${DHIS2_WEB_CONTAINER:-}"
db_container="${DHIS2_DB_CONTAINER:-}"
target="all"
tail_count=1000

usage() {
  sed -n '3,19p' "${BASH_SOURCE[0]}"
}

# Parse flag args first; fall back to positional for back-compat.
positional=()
while (( $# > 0 )); do
  case "$1" in
    --web)    web_container="${2:?--web requires an argument}"; shift 2 ;;
    --db)     db_container="${2:?--db requires an argument}";   shift 2 ;;
    --target) target="${2:?--target requires an argument}";     shift 2 ;;
    --tail)   tail_count="${2:?--tail requires an argument}";   shift 2 ;;
    -h|--help) usage; exit 0 ;;
    --) shift; positional+=("$@"); break ;;
    -*) echo "unknown flag: $1" >&2; usage >&2; exit 1 ;;
    *)  positional+=("$1"); shift ;;
  esac
done

# Positional fallback: [target] [tail]
if (( ${#positional[@]} >= 1 )); then target="${positional[0]}"; fi
if (( ${#positional[@]} >= 2 )); then tail_count="${positional[1]}"; fi

# Final fallback to the default compose project names.
web_container="${web_container:-dhis2-mac-web-1}"
db_container="${db_container:-dhis2-mac-db-1}"

case "$target" in
  web|db|all) ;;
  *) echo "invalid target: $target (expected web|db|all)" >&2; exit 1 ;;
esac

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

  local tmp="${out}.tmp"
  docker logs "${tail_arg[@]}" --timestamps "$container" >"$tmp" 2>&1
  mv "$tmp" "$out"
  echo "wrote $out ($(wc -l <"$out" | tr -d ' ') lines)"
}

case "$target" in
  web) dump web "$web_container" ;;
  db)  dump db  "$db_container"  ;;
  all)
    dump web "$web_container"
    dump db  "$db_container"
    ;;
esac

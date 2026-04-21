#!/usr/bin/env bash
set -euo pipefail

# Bring up an empty local DHIS2 instance and prepare .env.local so the
# metadata-as-code CLI (`pnpm plan` / `pnpm apply`) can talk to it.
#
#   1. docker compose up -d   (empty Postgres + DHIS2 web; no sample data)
#   2. Poll /api/system/info with Basic admin:district until ready
#   3. POST /api/apiToken to mint a Personal Access Token
#   4. Write DHIS2_BASE_URL + DHIS2_TOKEN to .env.local (idempotent)
#   5. Print container IDs so `pull-logs.sh` can consume them
#
# Usage: scripts/dhis2-up.sh

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
compose_file="$repo_root/docker/docker-compose.yml"
env_file="$repo_root/.env.local"

base_url="${DHIS2_BASE_URL_LOCAL:-http://localhost:8080}"
admin_user="${DHIS2_ADMIN_USER:-admin}"
admin_pass="${DHIS2_ADMIN_PASSWORD:-district}"
# How long to wait for DHIS2 to finish its first-boot Flyway migrations.
# First cold boot on dhis2/core-dev can easily take several minutes.
ready_timeout_seconds="${DHIS2_READY_TIMEOUT:-900}"
poll_interval_seconds=5

say() { printf '▸ %s\n' "$*"; }
die() { printf 'error: %s\n' "$*" >&2; exit 1; }

command -v docker >/dev/null 2>&1 || die "docker not found on PATH"
command -v curl   >/dev/null 2>&1 || die "curl not found on PATH"
command -v node   >/dev/null 2>&1 || die "node not found on PATH"

say "Starting DHIS2 stack via $compose_file"
docker compose -f "$compose_file" up -d

say "Waiting for DHIS2 at $base_url (timeout ${ready_timeout_seconds}s)"
deadline=$(( $(date +%s) + ready_timeout_seconds ))
while :; do
  http_code="$(
    curl --silent --show-error --output /dev/null \
      --write-out '%{http_code}' \
      --user "$admin_user:$admin_pass" \
      --max-time 5 \
      "$base_url/api/system/info" || echo "000"
  )"

  if [[ "$http_code" == "200" ]]; then
    say "DHIS2 is ready (HTTP 200 from /api/system/info)"
    break
  fi

  if (( $(date +%s) >= deadline )); then
    die "DHIS2 did not become ready within ${ready_timeout_seconds}s (last HTTP code: $http_code)"
  fi

  printf '  still waiting (HTTP %s)…\n' "$http_code"
  sleep "$poll_interval_seconds"
done

say "Creating Personal Access Token for $admin_user"
pat_response="$(
  curl --silent --show-error --fail-with-body \
    --user "$admin_user:$admin_pass" \
    --header 'Content-Type: application/json' \
    --header 'Accept: application/json' \
    --request POST \
    --data '{}' \
    "$base_url/api/apiToken"
)" || die "PAT creation failed. Response: $pat_response"

# The plaintext token lives at $.response.key in the WebMessage envelope.
token="$(
  printf '%s' "$pat_response" \
    | node -e '
      let s = "";
      process.stdin.on("data", (c) => (s += c));
      process.stdin.on("end", () => {
        try {
          const j = JSON.parse(s);
          const key = j?.response?.key ?? j?.key;
          if (!key) { console.error("no .response.key in PAT response:", s); process.exit(2); }
          process.stdout.write(key);
        } catch (e) {
          console.error("failed to parse PAT response:", e.message, "\nbody:", s);
          process.exit(2);
        }
      });
    '
)" || die "could not extract PAT key from response"

[[ -n "$token" ]] || die "extracted empty PAT key"

say "Writing DHIS2_BASE_URL and DHIS2_TOKEN to $env_file"
# Idempotent upsert: overwrite existing keys, keep every other line.
# Uses node (already required for the CLI) to avoid a python3 dependency.
DHIS2_ENV_FILE="$env_file" DHIS2_BASE_URL_VALUE="$base_url" DHIS2_TOKEN_VALUE="$token" \
  node -e '
    const fs = require("node:fs");
    const path = process.env.DHIS2_ENV_FILE;
    const updates = {
      DHIS2_BASE_URL: process.env.DHIS2_BASE_URL_VALUE,
      DHIS2_TOKEN: process.env.DHIS2_TOKEN_VALUE,
    };
    const existing = fs.existsSync(path) ? fs.readFileSync(path, "utf8") : "";
    const lines = existing ? existing.replace(/\n$/, "").split("\n") : [];
    const seen = new Set();
    const out = lines.map((line) => {
      const s = line.replace(/^\s+/, "");
      if (s.startsWith("#") || !s.includes("=")) return line;
      const key = s.split("=", 1)[0].trim();
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        seen.add(key);
        return `${key}=${updates[key]}`;
      }
      return line;
    });
    for (const [key, value] of Object.entries(updates)) {
      if (!seen.has(key)) out.push(`${key}=${value}`);
    }
    fs.writeFileSync(path, out.join("\n") + "\n");
  '

say "Container IDs (pipe into scripts/pull-logs.sh):"
web_id="$(docker compose -f "$compose_file" ps --quiet web || true)"
db_id="$( docker compose -f "$compose_file" ps --quiet db  || true)"
printf '  web: %s\n' "${web_id:-<none>}"
printf '  db:  %s\n' "${db_id:-<none>}"

cat <<EOF

DHIS2 is up at $base_url
  admin user:     $admin_user
  admin password: $admin_pass
  env file:       $env_file

Next:
  pnpm check    # validate schema locally
  pnpm plan     # dry-run against local DHIS2
  pnpm apply    # import for real

Dump logs (for the agent):
  scripts/pull-logs.sh --web ${web_id:-<web-id>} --db ${db_id:-<db-id>}

Tear down (wipes data):
  scripts/dhis2-down.sh
EOF

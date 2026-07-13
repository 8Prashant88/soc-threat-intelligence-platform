#!/usr/bin/env bash
#
# SecureLogTI - macOS Log Shipper Agent
# -------------------------------------
# Streams this Mac's unified logs and forwards security-relevant events to your
# SecureLogTI instance in real time, where they are parsed, analyzed, and turned
# into threat intelligence and alerts.
#
# Usage:
#   export SECURELOG_ENDPOINT="http://localhost:3000/api/ingest"
#   export SECURELOG_API_KEY="slt_xxxxxxxx..."   # create one in Settings → Devices & API Keys
#   ./securelog-agent.sh
#
# Optional environment variables:
#   SECURELOG_PREDICATE   Override the `log stream` predicate (default: auth/security processes)
#   SECURELOG_BATCH_SIZE  Lines to buffer before sending (default: 20)
#   SECURELOG_FLUSH_SECS  Max seconds before flushing a partial batch (default: 5)
#   SECURELOG_LEVEL       Log level: default | info | debug (default: info)
#
# Notes:
#  * Run as your normal user. Some auth events (and source IPs) are marked
#    <private> by macOS unless a logging configuration profile enabling private
#    data is installed. Without it, threat detection still works for any event
#    whose IP is visible.
#  * To ship a plain log file instead, see the tail example at the bottom.

set -euo pipefail

ENDPOINT="${SECURELOG_ENDPOINT:?Set SECURELOG_ENDPOINT, e.g. http://localhost:3000/api/ingest}"
API_KEY="${SECURELOG_API_KEY:?Set SECURELOG_API_KEY to your device key (Settings → Devices & API Keys)}"
BATCH_SIZE="${SECURELOG_BATCH_SIZE:-20}"
FLUSH_SECS="${SECURELOG_FLUSH_SECS:-5}"
LEVEL="${SECURELOG_LEVEL:-info}"
PREDICATE="${SECURELOG_PREDICATE:-process == \"sshd\" OR process == \"sudo\" OR process == \"loginwindow\" OR process == \"authd\" OR process == \"opendirectoryd\" OR process == \"securityd\" OR process == \"socketfilterfw\"}"

send_batch() {
  local payload="$1"
  [ -z "$payload" ] && return 0
  if ! curl -sS --max-time 15 -X POST "$ENDPOINT" \
        -H "Authorization: Bearer ${API_KEY}" \
        -H "Content-Type: text/plain" \
        --data-binary "$payload" >/dev/null; then
    echo "[securelog-agent] WARN: failed to deliver batch, will retry on next events" >&2
  fi
}

echo "[securelog-agent] streaming macOS logs -> ${ENDPOINT}"
echo "[securelog-agent] predicate: ${PREDICATE}"

buffer=""
count=0
last=$(date +%s)

# `log stream --style ndjson` emits one JSON object per line. Each line is
# forwarded verbatim; the server parser understands Apple's unified-log fields.
log stream --style ndjson --level "$LEVEL" --predicate "$PREDICATE" | while IFS= read -r line; do
  # Keep only JSON object lines (skip the human-readable header line).
  case "$line" in
    \{*) ;;
    *) continue ;;
  esac

  buffer+="${line}"$'\n'
  count=$((count + 1))
  now=$(date +%s)

  if [ "$count" -ge "$BATCH_SIZE" ] || [ $((now - last)) -ge "$FLUSH_SECS" ]; then
    send_batch "$buffer"
    echo "[securelog-agent] shipped ${count} events"
    buffer=""
    count=0
    last=$now
  fi
done

# ---------------------------------------------------------------------------
# Alternative: ship a plain text log file (e.g. an app log) in real time.
# Uncomment and adjust instead of using `log stream` above.
#
# tail -n0 -F /var/log/system.log | while IFS= read -r line; do
#   curl -sS -X POST "$ENDPOINT" \
#     -H "Authorization: Bearer ${API_KEY}" \
#     -H "Content-Type: text/plain" \
#     --data-binary "$line" >/dev/null
# done

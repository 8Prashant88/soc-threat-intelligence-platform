#!/usr/bin/env bash
#
# SecureLogTI - Linux Log Shipper Agent
# -------------------------------------
# Streams this Linux machine's authentication / security logs and forwards them
# to your SecureLogTI instance in real time, where they are parsed, analyzed,
# and turned into threat intelligence and alerts.
#
# Usage:
#   export SECURELOG_ENDPOINT="http://localhost:3000/api/ingest"
#   export SECURELOG_API_KEY="slt_xxxxxxxx..."   # create one in Settings → Devices & API Keys
#   ./securelog-agent-linux.sh
#
# Optional environment variables:
#   SECURELOG_SOURCE      Log source: auto | journal | <path> (default: auto)
#   SECURELOG_BATCH_SIZE  Lines to buffer before sending (default: 20)
#   SECURELOG_FLUSH_SECS  Max seconds before flushing a partial batch (default: 5)
#
# Sources (auto-detected in this order):
#   1. systemd journal  (journalctl -f)      — most modern distros
#   2. /var/log/auth.log                      — Debian/Ubuntu
#   3. /var/log/secure                        — RHEL/CentOS/Fedora
# Run with sudo if your user cannot read the auth logs.

set -euo pipefail

ENDPOINT="${SECURELOG_ENDPOINT:?Set SECURELOG_ENDPOINT, e.g. http://localhost:3000/api/ingest}"
API_KEY="${SECURELOG_API_KEY:?Set SECURELOG_API_KEY to your device key (Settings → Devices & API Keys)}"
BATCH_SIZE="${SECURELOG_BATCH_SIZE:-20}"
FLUSH_SECS="${SECURELOG_FLUSH_SECS:-5}"
SOURCE="${SECURELOG_SOURCE:-auto}"

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

# Choose a log stream command based on what's available.
pick_stream() {
  if [ "$SOURCE" = "journal" ] || { [ "$SOURCE" = "auto" ] && command -v journalctl >/dev/null 2>&1; }; then
    echo "journalctl -f -n0 -o short-iso SYSLOG_FACILITY=10 SYSLOG_FACILITY=4"
  elif [ "$SOURCE" != "auto" ] && [ -r "$SOURCE" ]; then
    echo "tail -n0 -F $SOURCE"
  elif [ -r /var/log/auth.log ]; then
    echo "tail -n0 -F /var/log/auth.log"
  elif [ -r /var/log/secure ]; then
    echo "tail -n0 -F /var/log/secure"
  else
    echo "" # nothing readable
  fi
}

STREAM_CMD="$(pick_stream)"
if [ -z "$STREAM_CMD" ]; then
  echo "[securelog-agent] ERROR: no readable log source. Set SECURELOG_SOURCE to a file path, or run with sudo." >&2
  exit 1
fi

echo "[securelog-agent] streaming Linux logs -> ${ENDPOINT}"
echo "[securelog-agent] source: ${STREAM_CMD}"

buffer=""
count=0
last=$(date +%s)

# shellcheck disable=SC2086
$STREAM_CMD | while IFS= read -r line; do
  [ -z "$line" ] && continue
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

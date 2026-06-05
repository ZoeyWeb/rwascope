#!/bin/bash
set -e
LOG_DIR=/var/log/nginx
OUT=/var/www/rwascope/data/visitors.json
CUMULATIVE=/var/www/rwascope/data/cumulative-readings.json
mkdir -p /var/www/rwascope/data

# 1. Today live count
PV_CURRENT=$(sudo wc -l < "$LOG_DIR/access.log" 2>/dev/null || echo 0)

# 2. Persisted cumulative (sum of all completed days already consumed by daily cron)
PV_CUMULATIVE=0
if [ -f "$CUMULATIVE" ]; then
    PV_CUMULATIVE=$(jq -r '.cumulative_pageviews // 0' "$CUMULATIVE" 2>/dev/null || echo 0)
fi

# 3. Bridge: include access.log.1 only if its date is NOT yet consumed.
#    This covers the 30-min gap between logrotate (00:00 UTC) and daily cron (00:30 UTC)
#    so the counter never dips after midnight rotation.
PV_BRIDGE=0
if [ -f "$LOG_DIR/access.log.1" ]; then
    # Extract ISO date from first log line of access.log.1
    FIRST_LINE=$(sudo head -1 "$LOG_DIR/access.log.1" 2>/dev/null || true)
    if [ -n "$FIRST_LINE" ]; then
        DAY=$(echo   "$FIRST_LINE" | grep -oP '(?<=\[)\d{2}(?=/\w{3}/\d{4}:)' || true)
        MON=$(echo   "$FIRST_LINE" | grep -oP '(?<=\[\d{2}/)\w{3}(?=/\d{4}:)' || true)
        YEAR=$(echo  "$FIRST_LINE" | grep -oP '(?<=\[\d{2}/\w{3}/)\d{4}(?=:)' || true)
        if [ -n "$DAY" ] && [ -n "$MON" ] && [ -n "$YEAR" ]; then
            case $MON in
                Jan) MNUM=01;; Feb) MNUM=02;; Mar) MNUM=03;; Apr) MNUM=04;;
                May) MNUM=05;; Jun) MNUM=06;; Jul) MNUM=07;; Aug) MNUM=08;;
                Sep) MNUM=09;; Oct) MNUM=10;; Nov) MNUM=11;; Dec) MNUM=12;;
                *)   MNUM=00;;
            esac
            ISO_DATE="${YEAR}-${MNUM}-${DAY}"
            ALREADY=$(jq -r --arg d "$ISO_DATE" \
                '(.consumed_log_dates // []) | index($d) != null' \
                "$CUMULATIVE" 2>/dev/null || echo "false")
            if [ "$ALREADY" != "true" ]; then
                PV_BRIDGE=$(sudo wc -l < "$LOG_DIR/access.log.1" 2>/dev/null || echo 0)
            fi
        fi
    fi
fi

PV=$((PV_CURRENT + PV_CUMULATIVE + PV_BRIDGE))

# Unique visitors: unchanged — rolling window from all available logs (different metric)
UV=$( ( sudo awk '{print $1}' "$LOG_DIR/access.log" 2>/dev/null; \
         [ -f "$LOG_DIR/access.log.1" ] && sudo awk '{print $1}' "$LOG_DIR/access.log.1" 2>/dev/null; \
         sudo zcat "$LOG_DIR"/access.log.*.gz 2>/dev/null | awk '{print $1}' ) | sort -u | wc -l )

NOW=$(date -u +'%Y-%m-%dT%H:%M:%SZ')

# Atomic write
cat > "$OUT.tmp" <<EOF
{
  "cumulative_pageviews": $PV,
  "cumulative_visitors": $UV,
  "updated_at": "$NOW"
}
EOF
mv "$OUT.tmp" "$OUT"
chmod 644 "$OUT"

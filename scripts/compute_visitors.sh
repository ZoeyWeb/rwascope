#!/bin/bash
set -e
LOG_DIR=/var/log/nginx
OUT=/var/www/rwascope/data/visitors.json
mkdir -p /var/www/rwascope/data

PV_CURRENT=$(sudo wc -l < $LOG_DIR/access.log 2>/dev/null || echo 0)
# access.log.1 is left uncompressed by delaycompress until the next rotation cycle;
# without this line the entire previous day's traffic is missing for ~24 h.
PV_DELAY=$([ -f $LOG_DIR/access.log.1 ] && sudo wc -l < $LOG_DIR/access.log.1 || echo 0)
PV_ROTATED=$(sudo zcat $LOG_DIR/access.log.*.gz 2>/dev/null | wc -l || echo 0)
PV=$((PV_CURRENT + PV_DELAY + PV_ROTATED))

UV=$( ( sudo awk '{print $1}' $LOG_DIR/access.log 2>/dev/null; \
         [ -f $LOG_DIR/access.log.1 ] && sudo awk '{print $1}' $LOG_DIR/access.log.1 2>/dev/null; \
         sudo zcat $LOG_DIR/access.log.*.gz 2>/dev/null | awk '{print $1}' ) | sort -u | wc -l )

NOW=$(date -u +'%Y-%m-%dT%H:%M:%SZ')

cat > $OUT << EOF
{
  "cumulative_pageviews": $PV,
  "cumulative_visitors": $UV,
  "updated_at": "$NOW"
}
EOF

chmod 644 $OUT

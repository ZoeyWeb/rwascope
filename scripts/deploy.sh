#!/usr/bin/env bash
# deploy.sh — Site deploy for rwa-index.com
#
# Usage:
#   ./scripts/deploy.sh              # frontend + leaderboard refresh (default)
#   ./scripts/deploy.sh frontend     # frontend only
#   ./scripts/deploy.sh backend      # backend only
#   ./scripts/deploy.sh leaderboard  # refresh leaderboard/assets-live data only
#   ./scripts/deploy.sh all          # frontend + backend + leaderboard refresh
#
# Prerequisites: ~/.ssh/lightsail.pem must exist and be chmod 400

set -euo pipefail

SERVER="${DEPLOY_HOST:-ubuntu@54.255.213.46}"
SSH_KEY="${DEPLOY_SSH_KEY:-$HOME/.ssh/lightsail.pem}"
REMOTE_WEB="/var/www/rwascope"
REMOTE_BACKEND="/opt/rwascope-backend"
REMOTE_SCRIPTS="/opt/rwascope"

MODE="${1:-frontend}"

deploy_frontend() {
  echo "==> Building frontend..."
  (cd web && npm run build)

  echo "==> Backing up current build..."
  ssh -i "$SSH_KEY" "$SERVER" \
    "[ -d $REMOTE_WEB ] && rm -rf ${REMOTE_WEB}.bak && cp -a $REMOTE_WEB ${REMOTE_WEB}.bak || true"

  echo "==> Deploying frontend..."
  # Use --filter='P ...' (protect rule) to prevent rsync from deleting server-side
  # generated files. Unlike --exclude, the 'P' protect rule has unambiguous semantics:
  # it explicitly prevents matched files from being deleted even when --delete is used,
  # regardless of rsync version. --exclude also suppresses the upload, so we need both.
  rsync -avz --delete \
    --filter='P data/leaderboard.json' \
    --filter='P data/assets/assets-live.json' \
    --filter='P data/visitors.json' \
    --filter='P data/snapshots/' \
    --filter='P media/' \
    --exclude='data/leaderboard.json' \
    --exclude='data/assets/assets-live.json' \
    --exclude='data/visitors.json' \
    --exclude='data/snapshots/' \
    --exclude='media/' \
    web/dist/ "$SERVER:$REMOTE_WEB/" \
    -e "ssh -i $SSH_KEY"
  echo "    Frontend deployed."

  # Bust the backend's in-memory JSON cache so updated data files (e.g. projects.json)
  # are visible immediately rather than after the next TTL expiry.
  echo "==> Restarting backend to bust JSON cache..."
  ssh -i "$SSH_KEY" "$SERVER" "sudo systemctl restart rwascope-backend"
  echo "    Backend cache cleared."
}

deploy_backend() {
  echo "==> Deploying backend..."
  rsync -avz \
    --exclude='.venv' --exclude='__pycache__' \
    --exclude='*.pyc' --exclude='.env' \
    backend/ "$SERVER:$REMOTE_BACKEND/" \
    -e "ssh -i $SSH_KEY"

  ssh -i "$SSH_KEY" "$SERVER" \
    "cd $REMOTE_BACKEND && source venv/bin/activate && alembic upgrade head && sudo systemctl restart rwascope-backend"
  echo "    Backend deployed and restarted."
}

refresh_leaderboard() {
  echo "==> Running leaderboard fetch (DeFiLlama)..."
  if ssh -o ServerAliveInterval=10 -o ServerAliveCountMax=12 \
       -i "$SSH_KEY" "$SERVER" \
       "python3 $REMOTE_SCRIPTS/fetch_leaderboard.py 2>&1 | tee -a $REMOTE_SCRIPTS/logs/leaderboard.log"; then
    echo "    Leaderboard data refreshed."
  else
    echo "    WARNING: Leaderboard refresh failed (DeFiLlama may be down)."
    echo "    Run './scripts/deploy.sh leaderboard' later to retry."
  fi

  # Verify critical live data files are present AFTER the refresh attempt.
  # Fail loudly so a missing file doesn't silently serve 404 to users.
  echo "==> Verifying live data files are intact..."
  ssh -i "$SSH_KEY" "$SERVER" "
    missing=''
    [ -f $REMOTE_WEB/data/leaderboard.json ]        || missing=\"\$missing leaderboard.json\"
    [ -f $REMOTE_WEB/data/assets/assets-live.json ] || missing=\"\$missing assets-live.json\"
    [ -f $REMOTE_WEB/data/visitors.json ]           || missing=\"\$missing visitors.json\"
    if [ -n \"\$missing\" ]; then
      echo \"  ERROR: missing server-side files:\$missing\"
      echo \"  DeFiLlama refresh failed AND rsync deleted the old version.\"
      echo \"  Fix: retry with './scripts/deploy.sh leaderboard'\"
      exit 1
    else
      echo \"  All live data files present.\"
    fi
  "
}

update_fetch_script() {
  # fetch_leaderboard.py is root-owned on the server; use sudo to update it
  echo "==> Updating fetch script on server (requires sudo)..."
  rsync -avz backend/scripts/fetch_leaderboard.py \
    "$SERVER:/tmp/fetch_leaderboard.py" \
    -e "ssh -i $SSH_KEY"
  ssh -i "$SSH_KEY" "$SERVER" \
    "sudo mv /tmp/fetch_leaderboard.py $REMOTE_SCRIPTS/fetch_leaderboard.py && sudo chmod 755 $REMOTE_SCRIPTS/fetch_leaderboard.py"
  echo "    Fetch script updated."
}

rollback_frontend() {
  echo "==> Rolling back frontend to previous build..."
  ssh -i "$SSH_KEY" "$SERVER" "
    if [ -d ${REMOTE_WEB}.bak ]; then
      rm -rf ${REMOTE_WEB}.prev 2>/dev/null || true
      cp -a $REMOTE_WEB ${REMOTE_WEB}.prev
      rm -rf $REMOTE_WEB
      mv ${REMOTE_WEB}.bak $REMOTE_WEB
      sudo systemctl restart rwascope-backend
      echo '    Rollback complete. Previous build restored.'
    else
      echo '    ERROR: No backup found at ${REMOTE_WEB}.bak — cannot roll back.'
      exit 1
    fi
  "
}

case "$MODE" in
  frontend)
    deploy_frontend
    refresh_leaderboard
    ;;
  backend)
    deploy_backend
    ;;
  leaderboard)
    refresh_leaderboard
    ;;
  all)
    deploy_frontend
    deploy_backend
    refresh_leaderboard
    ;;
  update-script)
    update_fetch_script
    ;;
  rollback)
    rollback_frontend
    ;;
  *)
    echo "Usage: $0 [frontend|backend|leaderboard|update-script|all|rollback]"
    exit 1
    ;;
esac

echo ""
echo "==> Done. https://rwa-index.com"

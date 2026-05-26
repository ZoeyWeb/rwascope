#!/bin/bash
set -e

# Load Cloudflare credentials
if [ -f ~/.rwa-index-deploy.env ]; then
  export $(grep -v '^#' ~/.rwa-index-deploy.env | xargs)
else
  echo "✗ Missing ~/.rwa-index-deploy.env (Cloudflare credentials)"
  exit 1
fi

echo "→ Building..."
cd web
npm run build

echo "→ Uploading to server..."
rsync -avz \
  -e "ssh -i ~/Downloads/LightsailDefaultKey-ap-southeast-1.pem" \
  dist/ ubuntu@54.255.213.46:/tmp/rwascope-new/

echo "→ Swapping on server..."
ssh -i ~/Downloads/LightsailDefaultKey-ap-southeast-1.pem ubuntu@54.255.213.46 << 'EOF'
  sudo rm -rf /var/www/rwascope.bak
  sudo mv /var/www/rwascope /var/www/rwascope.bak
  sudo mv /tmp/rwascope-new /var/www/rwascope
EOF

echo "→ Purging Cloudflare cache..."
PURGE_RESULT=$(curl -s -X POST \
  "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}')

if echo "$PURGE_RESULT" | grep -q '"success":true'; then
  echo "  ✓ Cloudflare cache purged"
else
  echo "  ✗ Purge failed:"
  echo "$PURGE_RESULT"
  exit 1
fi

echo ""
echo "✓ Done. Live at https://rwa-index.com"
echo "  (Use incognito if you cached locally)"

# Nginx Canonical Domain Migration Plan

**Goal:** Make `rwa-index.com` the single canonical origin. All other hostnames
(`www.rwa-index.com`, `onlyidea.net`, `www.onlyidea.net`, `raterwa.onlyidea.net`)
issue a permanent `301` redirect to the canonical equivalent on `rwa-index.com`.

**Status (as of 2026-05-03):**

| Hostname | Current behavior | Target behavior |
|---|---|---|
| `rwa-index.com` | Serves the SPA + `/api/*` (origin) | **Origin (unchanged)** |
| `www.rwa-index.com` | ❌ Not reachable (no server block) | `301 → https://rwa-index.com$request_uri` |
| `onlyidea.net` | Serves the same SPA (duplicate origin) | `301 → https://rwa-index.com$request_uri` |
| `www.onlyidea.net` | Serves the same SPA (duplicate origin) | `301 → https://rwa-index.com$request_uri` |
| `raterwa.onlyidea.net` | Serves the API (alternate origin) | `301 → https://rwa-index.com$request_uri` |

> ⚠️ **Why this matters:** Search engines treat duplicate origins as separate
> sites and split link-equity / can flag duplicate content. For an academic
> tool that wants to be cited by HKMA / SFC / media, having one canonical URL
> is critical for credibility. See `CLAUDE.md` "Canonical Domain Policy".

---

## Pre-flight checks (run before changing anything)

```bash
SSH="ssh -i ~/.ssh/lightsail.pem ubuntu@54.255.213.46"

# 1. List currently-enabled sites and the nginx config files
$SSH "ls -la /etc/nginx/sites-enabled/ && ls -la /etc/nginx/sites-available/"

# 2. Print the current onlyidea config so we know exactly what we're replacing
$SSH "sudo cat /etc/nginx/sites-available/onlyidea"

# 3. Confirm certificates exist for all four hostnames
$SSH "sudo ls -la /etc/letsencrypt/live/ 2>/dev/null || sudo certbot certificates"

# 4. Sanity check: nginx config currently passes
$SSH "sudo nginx -t"

# 5. Back up the current config (so we can roll back instantly)
$SSH "sudo cp /etc/nginx/sites-available/onlyidea /etc/nginx/sites-available/onlyidea.bak.$(date +%Y%m%d)"
```

If `www.rwa-index.com` does not yet have a TLS cert, expand the existing one:

```bash
# Adjust -d list to whatever certificate currently covers rwa-index.com
$SSH "sudo certbot certonly --nginx --expand \
    -d rwa-index.com -d www.rwa-index.com \
    -d onlyidea.net -d www.onlyidea.net \
    -d raterwa.onlyidea.net"
```

---

## Target Nginx config

Rename `onlyidea` → `rwa-index` for clarity. Replace the file contents with:

```nginx
# /etc/nginx/sites-available/rwa-index
#
# Single canonical origin: rwa-index.com
# Everything else 301s to it.
# ---------------------------------------------------------------

# ---- HTTP → HTTPS (catch-all for any hostname on :80) ----
server {
    listen 80;
    listen [::]:80;
    server_name rwa-index.com www.rwa-index.com
                onlyidea.net www.onlyidea.net
                raterwa.onlyidea.net;
    return 301 https://rwa-index.com$request_uri;
}

# ---- Legacy / non-canonical HTTPS hosts → 301 to canonical ----
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.rwa-index.com
                onlyidea.net www.onlyidea.net
                raterwa.onlyidea.net;

    # Reuse the canonical certificate (certbot --expand should cover all SANs)
    ssl_certificate     /etc/letsencrypt/live/rwa-index.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rwa-index.com/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    return 301 https://rwa-index.com$request_uri;
}

# ---- Canonical origin: rwa-index.com ----
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name rwa-index.com;

    ssl_certificate     /etc/letsencrypt/live/rwa-index.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rwa-index.com/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/rwascope;
    index index.html;

    # API → uvicorn
    location /api/ {
        proxy_pass         http://127.0.0.1:8001/api/;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # News thumbnail images (downloaded by fetch_rss.py ingestion pipeline)
    # Files stored at /var/www/rwascope/media/{item_id}.{ext}
    # Directory owner: ubuntu:www-data 2775 (backend writes, nginx reads)
    location /media/ {
        alias /var/www/rwascope/media/;
        expires 30d;
        add_header Cache-Control "public";
        add_header X-Content-Type-Options nosniff;
        access_log off;
    }

    # Long-cache hashed assets
    location ~* ^/assets/.*\.(js|css|woff2?|png|jpg|jpeg|svg|webp)$ {
        expires    1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Cut-over procedure

```bash
SSH="ssh -i ~/.ssh/lightsail.pem ubuntu@54.255.213.46"

# 1. Upload new config
scp -i ~/.ssh/lightsail.pem nginx-rwa-index.conf \
    ubuntu@54.255.213.46:/tmp/rwa-index.conf

# 2. Install it (rename the file so the new name reflects reality)
$SSH "sudo mv /tmp/rwa-index.conf /etc/nginx/sites-available/rwa-index && \
      sudo ln -sf /etc/nginx/sites-available/rwa-index /etc/nginx/sites-enabled/rwa-index && \
      sudo rm -f /etc/nginx/sites-enabled/onlyidea"

# 3. Validate
$SSH "sudo nginx -t"

# 4. Reload (zero-downtime)
$SSH "sudo systemctl reload nginx"
```

---

## Post-cut verification

```bash
# All four legacy hosts must return 301 to https://rwa-index.com/...
for host in www.rwa-index.com onlyidea.net www.onlyidea.net raterwa.onlyidea.net; do
  echo "=== $host ==="
  curl -sI "https://$host/" | grep -iE "^(http|location)"
  echo
done

# Canonical must serve 200
curl -sI https://rwa-index.com/ | head -1

# API must still work on the canonical host
curl -s https://rwa-index.com/api/health
```

Expected:

- Each legacy host: `HTTP/2 301` + `Location: https://rwa-index.com/...`
- `rwa-index.com`: `HTTP/2 200`
- `/api/health`: `{"status":"ok"}` (or whatever the backend returns)

---

## Rollback

If anything breaks:

```bash
$SSH "sudo cp /etc/nginx/sites-available/onlyidea.bak.YYYYMMDD /etc/nginx/sites-available/onlyidea && \
      sudo ln -sf /etc/nginx/sites-available/onlyidea /etc/nginx/sites-enabled/onlyidea && \
      sudo rm -f /etc/nginx/sites-enabled/rwa-index && \
      sudo nginx -t && sudo systemctl reload nginx"
```

---

## Frontend / API client follow-ups

- `web/.env.production` — confirm `VITE_API_BASE_URL` (or equivalent) is either
  unset (relative `/api/`) or pointed at `https://rwa-index.com/api`. It must
  not point at `raterwa.onlyidea.net`.
- After the redirect goes live, search the codebase one more time for any
  hardcoded `onlyidea.net` strings (`grep -rn "onlyidea" --exclude-dir=node_modules`)
  and replace with `rwa-index.com` if any slipped through.
- Submit the new canonical to Google Search Console + Bing Webmaster, and
  add a "Change of Address" if `onlyidea.net` was previously verified.

---

## Cloudflare notes

- If both apex domains are proxied through Cloudflare, the redirect can also
  be done at CF (Bulk Redirects / Page Rules) without touching nginx. Doing
  it at nginx is more portable and survives a CF outage, so we keep it here.
- Make sure `onlyidea.net` and `www.onlyidea.net` DNS still resolve (orange
  cloud OK) so users hitting old links get the 301 instead of NXDOMAIN.

---

## Decommission timeline (suggested)

| Date | Action |
|---|---|
| T+0 | Roll out 301 redirects (this doc) |
| T+0 | Submit Google "Change of Address" |
| T+90 days | Audit referrer logs for any non-trivial `onlyidea.net` traffic |
| T+12 months | Decide whether to renew `onlyidea.net` registration |

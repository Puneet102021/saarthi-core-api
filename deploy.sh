#!/usr/bin/env bash
# Redeploy Saarthi on the server: run as root from anywhere.
#   bash /home/saarthi/app/deploy.sh
# Pulls the tracked branch, rebuilds the API and the web app, applies
# migrations, publishes the web build and restarts the API.
set -euo pipefail

APP=/home/saarthi/app
WEB_ROOT=/var/www/saarthi

as_app() { sudo -u saarthi -H bash -lc "cd $APP && $1"; }

echo "==> Pulling"
sudo -u saarthi git -C "$APP" pull --ff-only

echo "==> API: install, migrate, build"
as_app "npm ci --no-audit --no-fund && npx prisma generate && npx prisma migrate deploy && npm run build"

echo "==> Web: install, build"
as_app "cd web && npm ci --no-audit --no-fund && npm run build"

echo "==> Publishing web build"
mkdir -p "$(dirname "$WEB_ROOT")"
rm -rf "$WEB_ROOT.new"
cp -r "$APP/web/dist" "$WEB_ROOT.new"
chmod -R a+rX "$WEB_ROOT.new"
rm -rf "$WEB_ROOT.old"
[ -d "$WEB_ROOT" ] && mv "$WEB_ROOT" "$WEB_ROOT.old"
mv "$WEB_ROOT.new" "$WEB_ROOT"

echo "==> Restarting API"
systemctl restart saarthi-api
sleep 3
systemctl is-active saarthi-api
curl -fsS http://127.0.0.1:4100/ >/dev/null && echo "API healthy"

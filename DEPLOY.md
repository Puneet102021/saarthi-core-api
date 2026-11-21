# Deploying Saarthi Core API

Staging runs on a Hostinger VPS at **https://srv1925899.hstgr.cloud**.

## The server

| | |
| --- | --- |
| Host | `srv1925899.hstgr.cloud` (89.116.122.176), AlmaLinux 10 |
| App | `/home/saarthi/app`, owned by the `saarthi` user, built to `dist/` |
| Process | systemd unit `saarthi-api` running `node dist/server.js` on port 4100 (not reachable from outside; the firewall blocks it) |
| Proxy | nginx (`/etc/nginx/conf.d/saarthi-api.conf`) → port 4100; HTTPS from Let's Encrypt, renewed by `certbot-renew.timer` |
| Database | MariaDB 10.11, database `saarthi_staging`, user `saarthi_app`, listening on 127.0.0.1 only |
| Firewall | firewalld: only ssh, http, https are open |
| Config | `/home/saarthi/app/.env` (mode 600): `DATABASE_URL`, `JWT_SECRET`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `PORT`, `ENABLE_DEV_ROUTES=false` |

The `.env` on the server is the only copy of the database password and JWT secret.
Changing `JWT_SECRET` signs everyone out.

## Redeploy

Push your branch to GitHub, then on the server:

```bash
ssh root@srv1925899.hstgr.cloud
cd /home/saarthi/app
sudo -u saarthi git pull
sudo -u saarthi -H bash -lc "cd /home/saarthi/app && npm ci && npx prisma generate && npx prisma migrate deploy && npm run build"
systemctl restart saarthi-api
curl -s https://srv1925899.hstgr.cloud/
```

The server tracks the `companion-chat` branch. To follow another branch:
`sudo -u saarthi git checkout -B main origin/main`.

## Everyday commands

```bash
systemctl status saarthi-api          # running?
journalctl -u saarthi-api -f          # live logs
systemctl restart saarthi-api         # after editing .env
nano /home/saarthi/app/.env           # change config (e.g. OPENAI_API_KEY)
```

## Database access

MariaDB is not reachable from the internet. From the server, `mysql saarthi_staging` as root.
From your PC, tunnel over SSH and connect a client to `127.0.0.1:3307`:

```bash
ssh -L 3307:127.0.0.1:3306 root@srv1925899.hstgr.cloud
```

## Locations

`scripts/import-locations.ts` inserts every row of `clean_india_locations.csv` without
checking for duplicates. It has been run once on staging (6,356 places); only run it
again on an empty `Location` table.

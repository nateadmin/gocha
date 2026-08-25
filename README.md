# gocha
gocha is an ai project, mobile-first app hosted on a contabo server: 212.47.68.106
The server also has a Rydit project on it. The two will be integrated via API, but are distinct projects
rules for development on this project live in the personal-playbook repo. Refer to that rulebook before executing any prompt
gocha is going to function as a multi-faceted app utilizing ai. For example, it will introduce a messegnger similar to whatsapp, but with ai summary.
It will introduce transportation like uber, but interface-less- just chat
the primary goal is to begin remove the need for interface wherever undesirable

## Repo layout

- `app_gocha/` — Laravel JSON API shell (health, version, error contract)
- `mobile/gocha-app/` — React Native mobile-first shell (safe-area layout, placeholder theme)
- `scripts/` — Infisical pull and Contabo deploy helpers
- `deploy/nginx/gocha.ai.conf.template` — nginx vhost for when DNS is ready
- `PLATFORM_MAP.txt` — server and stack map

Planned production hostname: `gocha.ai` (nginx + certbot tomorrow).

## Server (Contabo)

Host: Contabo VPS vmi2918811 (212.47.68.106). Shared with Rydit; see rydit repo `CONNECTION.txt` for stack notes (nginx, PHP 8.3 FPM, MariaDB).

Deploy target: `/var/www/html/gocha` (`app_gocha` contents at repo root on server).

SSH: key-only via Infisical secret `CONTABO_PRIVATE_SSH_KEY` (user `root` today; migrate to deploy user per personal-playbook edge-protection when gocha app deploys).

## Infisical

Project: `gocha` (slug `gocha-ppe-o`). Environments: Development, Staging, Production.

Production bootstrap secrets (names only): `CONTABO_PRIVATE_SSH_KEY`, `CONTABO_PUBLIC_SSH_KEY`, `SERVER_HOST`, `SERVER_APP_PATH`, `SERVER_SSH_USER`.

Infisical API host: `https://app.infisical.com` (not `api.infisical.com`).

## Smoke checks

Agents: do not report a deploy job complete until every post-deploy URL below returns 2xx. See ship-live-and-test in personal-playbook.

### Pre-deploy

Run in order before push:

1. `git pull --ff-only origin main`
2. `cd app_gocha && php artisan test`
3. `cd mobile/gocha-app && npm test`

### Deploy

1. Push to `main`.
2. Export SSH key path: `GOCHA_SSH_KEY=/path/to/key ./scripts/deploy-to-contabo.sh`
3. On server: confirm `php artisan route:list --path=api` shows health and version.

Until `gocha.ai` is live, smoke the API on the server with a short-lived PHP built-in server:

```bash
cd /var/www/html/gocha && php artisan serve --host=127.0.0.1 --port=9080
curl -sS http://127.0.0.1:9080/api/health
curl -sS http://127.0.0.1:9080/api/version
```

After DNS + nginx for `gocha.ai`:

- GET `https://gocha.ai/api/health` → 200 JSON `status: ok`
- GET `https://gocha.ai/api/version` → 200, `version` equals `origin/main` HEAD after deploy
- GET `https://gocha.ai/` → 200 JSON service descriptor

### Log check

`journalctl -u nginx --since "2 min ago"` — no crash loop after reload.

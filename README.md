# gocha (Gocha)

Gocha is a mobile-first super-app: messaging, AI Catch Up, local communities (Around Me), business commerce, and integrations (e.g. Rydit). See `PRODUCT_ROADMAP.md` for phased builds.

Development rules live in the personal-playbook repo.

## Repo layout

- `app_gocha/` — Laravel JSON API shell (health, version, error contract)
- `mobile/gocha-app/` — React Native app (Chats, Catch Up, Discover, Calls, Settings)
- `scripts/` — Infisical pull and Contabo deploy helpers
- `deploy/nginx/gocha.ai.conf.template` — nginx vhost for when DNS is ready
- `PLATFORM_MAP.txt` — server and stack map

Planned production hostname: `gocha.ai` (live: nginx + Let’s Encrypt on Contabo).

## Live URLs

- API health: https://gocha.ai/api/health
- API version: https://gocha.ai/api/version
- Mobile web shell: https://gocha.ai/
- API meta: https://gocha.ai/api/meta

GitHub Actions publishes a preview build to the `gh-pages` branch only. That is not what serves https://gocha.ai/. The live web shell is static files on Contabo under `/var/www/html/gocha/public`, updated by `scripts/deploy-web-preview-to-contabo.sh` (also run automatically at the end of `scripts/deploy-to-contabo.sh` when `GOCHA_SSH_KEY` is set).

## Server (Contabo)

Host: Contabo VPS vmi2918811 (212.47.68.106). Shared with Rydit; see rydit repo `CONNECTION.txt` for stack notes (nginx, PHP 8.3 FPM, MariaDB).

Deploy target: `/var/www/html/gocha` (`app_gocha` contents at repo root on server).

SSH: key-only via Infisical secret `CONTABO_PRIVATE_SSH_KEY` (user `root` today; migrate to deploy user per personal-playbook edge-protection when gocha app deploys).

## Infisical

Project: `Rydit / Gocha` (id `e8bb8347-d16d-4614-930a-94912a2b354e`). Environments: Development, Staging, Production.

Production secrets (names only): `CONTABO_PRIVATE_SSH_KEY`, `CONTABO_PUBLIC_SSH_KEY`, `RESEND_API_KEY`, `SERVER_HOST`, `SERVER_APP_PATH`, `SERVER_SSH_USER`.

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
2. Export SSH key path and deploy API + web shell:
   `GOCHA_SSH_KEY=/path/to/key ./scripts/deploy-to-contabo.sh`
   (Web-only: `./scripts/deploy-web-preview-to-contabo.sh` with the same env var.)
3. On server: confirm `php artisan route:list --path=api` shows health and version.
4. Confirm the web bundle changed: view source on https://gocha.ai/ and check the `assets/index-*.js` filename is not `index-CbZMhqcY.js` (stale).

Until `gocha.ai` is live, smoke the API on the server with a short-lived PHP built-in server:

```bash
cd /var/www/html/gocha && php artisan serve --host=127.0.0.1 --port=9080
curl -sS http://127.0.0.1:9080/api/health
curl -sS http://127.0.0.1:9080/api/version
```

After DNS + nginx for `gocha.ai`:

- GET `https://gocha.ai/api/health` → 200 JSON `status: ok`
- GET `https://gocha.ai/api/version` → 200, `version` equals `origin/main` HEAD after deploy
- GET `https://gocha.ai/` → 200 mobile web shell (HTML)
- GET `https://gocha.ai/api/profile-cards` as an authenticated session → 200 JSON `{ cards: [] }` or a card list (401 without a session is expected)
- GET `https://gocha.ai/api/c/{slug}` → 200 JSON `{ card: ... }` for a real share slug, or 404 JSON `NOT_FOUND` when the slug is unknown
- GET `https://gocha.ai/c/{slug}` → 200 mobile web shell (HTML) for a share page; Chat on that page requires a signed-in account

### Log check

`journalctl -u nginx --since "2 min ago"` — no crash loop after reload.

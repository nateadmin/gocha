# gocha
gocha is an ai project, mobile-first app hosted on a contabo server: 212.47.68.106
The server also has a Rydit project on it. The two will be integrated via API, but are distinct projects
rules for development on this project live in the personal-playbook repo. Refer to that rulebook before executing any prompt
gocha is going to function as a multi-faceted app utilizing ai. For example, it will introduce a messegnger similar to whatsapp, but with ai summary.
It will introduce transportation like uber, but interface-less- just chat
the primary goal is to begin remove the need for interface wherever undesirable

## Server (Contabo)

Host: Contabo VPS vmi2918811 (212.47.68.106). Shared with Rydit; see rydit repo `CONNECTION.txt` for stack notes (nginx, PHP 8.3 FPM, MariaDB).

gocha app root on server: `/var/www/html/gocha` (placeholder `public/index.html` until first deploy).

SSH: key-only via Infisical secret `CONTABO_PRIVATE_SSH_KEY` (user `root` today; migrate to deploy user per personal-playbook edge-protection when gocha app deploys).

nginx vhost for gocha is not configured yet. Add a site block when the production hostname is chosen (certbot + `root` pointing at the app `public` directory).

## Infisical

Project: `gocha` (slug `gocha-ppe-o`). Environments: Development, Staging, Production.

Production bootstrap secrets (names only): `CONTABO_PRIVATE_SSH_KEY`, `CONTABO_PUBLIC_SSH_KEY`, `SERVER_HOST`, `SERVER_APP_PATH`, `SERVER_SSH_USER`.

Infisical API host: `https://app.infisical.com` (not `api.infisical.com`).

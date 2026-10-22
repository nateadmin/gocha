# Agent instructions

This repo follows the shared rulebook: https://github.com/nateadmin/personal-playbook

- Claude Code: the rulebook is installed as the `personal-playbook` plugin. Its skills load on their own when a task matches. If the plugin is missing, run `/plugin marketplace add nateadmin/personal-playbook` then `/plugin install personal-playbook@personal-playbook`.
- Cursor: the rulebook skills are cloned at `~/.cursor/skills/personal-playbook`. If missing: `git clone --depth 1 https://github.com/nateadmin/personal-playbook.git ~/.cursor/skills/personal-playbook`.
- This repo's README and project docs define only what the rulebook does not: package names, ports, URLs, deploy target, integration routes.

End every completed-work reply with `Rulebook: <skill>, <skill>: <clause>` naming every skill loaded, or `Rulebook: none loaded.`

# Gocha

Product roadmap: `PRODUCT_ROADMAP.md`. Align new work to the current build before adding scope.

## Packages and layout

- Laravel API: `app_gocha/` (Composer, PHP 8.3)
- React Native app (iOS, Android, web): `mobile/gocha-app/` (`GochaApp` npm package, Vite + react-native-web)
- Deploy scripts: `scripts/`
- Store kit: `mobile/gocha-app/store/README.md`

Web and native are the same product from `mobile/gocha-app/`. Behavior must match on https://app.gocha.ai/ and on iOS/Android. See `.cursor/rules/web-mobile-parity.mdc`.

## Ports and local commands

API (from `app_gocha/`):

```bash
cp .env.example .env
php artisan key:generate
php artisan serve
```

Default Laravel port: `8000`.

Mobile and web (from `mobile/gocha-app/`):

```bash
npm start
npm run web          # Vite, typically http://localhost:5173
npm run build:web    # production bundle for app.gocha.ai
npm run android      # or npm run ios on macOS
```

Tests: `cd app_gocha && php artisan test`. `cd mobile/gocha-app && npm test`.

## URLs and deploy target

- Production host: `app.gocha.ai` (Contabo VPS `212.47.68.106`, path `/var/www/html/gocha`)
- Marketing site: `gocha.ai` (separate host)
- API health: https://app.gocha.ai/api/health
- API version: https://app.gocha.ai/api/version
- API meta: https://app.gocha.ai/api/meta
- Web shell: https://app.gocha.ai/

Deploy: `GOCHA_SSH_KEY=/path/to/key ./scripts/deploy-to-contabo.sh` (also publishes the web bundle). Web-only: `./scripts/deploy-web-preview-to-contabo.sh`.

Secrets: Infisical project `gocha` (`e8bb8347-d16d-4614-930a-94912a2b354e`). Names only: `CONTABO_PRIVATE_SSH_KEY`, `OPEN_AI_API_KEY` / `OPENAI_API_KEY`, `GOOGLE_PLACES_API_KEY`, `FIREBASE_WEB_API_KEY`, `FIREBASE_PROJECT_ID`, `GOCHA_REVIEW_LOGIN_EMAIL`, `GOCHA_REVIEW_LOGIN_PASSWORD`.

Rydit is a separate repo on the same VPS, not this package.

## Integration routes

Sanctum JSON API. Representative routes (full smoke list in README):

- Auth: `POST /api/auth/otp/request`, `POST /api/auth/otp/verify`, `POST /api/auth/review/login`
- Session: `GET /api/me`, `GET /api/meta`
- Chat: `GET|POST /api/conversations`, `GET|POST /api/conversations/{id}/messages`
- Catch Up: `GET /api/catch-up` (OpenAI `gpt-4o-mini` via Infisical)
- Places: `GET /api/places/autocomplete`, `POST /api/places/details`
- Statuses, businesses, search, inbox: see README

Google Play review login: `google-review@gocha.ai` plus password on Sign in and Create account. Do not remove it unless the owner asked.

## Smoke checks

Full list is in README `Smoke checks`. Minimum after deploy:

- GET https://app.gocha.ai/api/health → 200 `status: ok`
- GET https://app.gocha.ai/api/version → 200, `version` equals `origin/main` HEAD
- GET https://app.gocha.ai/ → 200 HTML shell
- GET https://app.gocha.ai/api/meta → 200

## Branding

Neon Cyber in `mobile/gocha-app/src/theme/`. Primary `#1B00D8`. Logo: `mobile/gocha-app/assets/branding/Logo.jpeg`.

# Gocha — agent context

Rulebook: https://github.com/nateadmin/personal-playbook

Product roadmap: `PRODUCT_ROADMAP.md` (Gotcha phased plan). Align new work to the current build before adding scope.

## Layout

- Laravel API: `app_gocha/`
- React Native mobile app: `mobile/gocha-app/`
- Deploy scripts: `scripts/`
- Planned production host: `gocha.ai`

## Stack

- Mobile-first React Native super-app (messaging, Catch Up AI, Discover, calls, settings)
- Laravel JSON API on Contabo (health/version today; messaging/commerce APIs per roadmap)
- Rydit integration planned as Build 2 connector (distinct project on same VPS)
- Secrets only in Infisical (project `gocha`)

## Local development

API (from `app_gocha/`):

```bash
cp .env.example .env
php artisan key:generate
php artisan serve
```

Mobile (from `mobile/gocha-app/`):

```bash
npm start
npm run android   # or npm run ios on macOS
```

## Delivery

Pull, test, commit, push, deploy with `scripts/deploy-to-contabo.sh`, then run post-deploy smoke checks in README before reporting complete. See personal-playbook `standards/development/ship-live-and-test.md`.

## Branding

Neon Cyber theme in `mobile/gocha-app/src/theme/`. Primary `#1B00D8`, dark default. Logo: `mobile/gocha-app/assets/branding/logo.jpg`.

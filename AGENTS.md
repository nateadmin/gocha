# Gocha — agent context

Rulebook: https://github.com/nateadmin/personal-playbook

## Layout

- Laravel API: `app_gocha/`
- React Native mobile shell: `mobile/gocha-app/`
- Deploy scripts: `scripts/`
- Planned production host: `gocha.ai` (not wired in nginx until DNS + certbot)

## Stack

- Mobile-first React Native app talking to Laravel JSON API on Contabo
- Distinct from Rydit on the same VPS; integration via HTTP API later
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

Template styling and brand tokens are not in the shell yet. Use `mobile/gocha-app/src/theme/placeholders.ts` until the owner supplies the template.

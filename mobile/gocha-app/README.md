# gocha mobile shell

React Native mobile-first super-app shell: Chats, Catch Up (AI briefing), Businesses (AI order assistant), Calls, Settings.

## Brand

Neon Cyber color tokens in `src/theme/tokens.ts`. Primary `#1B00D8`, dark default. System UI fonts (San Francisco / Roboto).

## Navigation

Bottom tabs map to PRODUCT_ROADMAP.md:

- Chats — Build 1 messaging (personal, group, business)
- Catch up — Build 1 AI summaries
- Discover — Around Me (Build 1) + Businesses (Build 2)
- Calls — voice shell
- Settings — privacy, notifications, AI, Collective stub (Build 3)

## Data

Mock content in `src/data/mock.ts` until Laravel API routes ship.

## Preview

Browser (fastest):

```bash
cd mobile/gocha-app
npm install
npm run web
```

Open http://localhost:5173. Logo asset: `assets/branding/Logo.jpeg`.

Hosted preview: https://gocha.ai/

Android emulator:

```bash
cd mobile/gocha-app
npm install
npm start
```

In a second terminal (Android Studio emulator running, SDK configured):

```bash
cd mobile/gocha-app
npm run android
```

iOS simulator (macOS + Xcode):

```bash
cd mobile/gocha-app
npm run ios
```

## Commands

- `npm start` — Metro bundler
- `npm run web` — Vite browser preview (react-native-web)
- `npm run web:host` — same, bound to 0.0.0.0 for LAN access
- `npm run android` — Android build
- `npm run ios` — iOS build (macOS + Xcode)
- `npm test` — Jest
- `npm run lint` — ESLint

## API config

Planned host: `https://gocha.ai` in `src/config/api.ts`.

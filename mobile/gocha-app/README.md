# gocha mobile shell

React Native mobile-first super-app shell: Chats, Catch Up (AI briefing), Businesses (AI order assistant), Calls, Settings.

## Brand

Neon Cyber tokens in `src/theme/tokens.ts`. Primary `#1B00D8`. Default theme: dark.

## Navigation

Bottom tabs map to PRODUCT_ROADMAP.md:

- Chats — Build 1 messaging (personal, group, business)
- Catch up — Build 1 AI summaries
- Discover — Around Me (Build 1) + Businesses (Build 2)
- Calls — voice shell
- Settings — privacy, notifications, AI, Collective stub (Build 3)

## Data

Mock content in `src/data/mock.ts` until Laravel API routes ship.

## Commands

- `npm start` — Metro bundler
- `npm run android` — Android build
- `npm run ios` — iOS build (macOS + Xcode)
- `npm test` — Jest
- `npm run lint` — ESLint

## API config

Planned host: `https://gocha.ai` in `src/config/api.ts`.

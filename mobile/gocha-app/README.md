# gocha mobile shell

React Native mobile-first app. Neon Cyber brand library with primary `#1B00D8`, dark mode default.

## Brand library

- Tokens: `src/theme/tokens.ts` (light + dark Neon Cyber variables)
- Provider: `src/theme/ThemeContext.tsx` (`ThemeProvider`, default `dark`)
- Fonts: Rajdhani, Fira Code, Orbitron via `@expo-google-fonts/*` + `expo-font`
- Components: `src/components/brand/` (Button, Card, Input, Badge, Text)
- Logo: `assets/branding/logo.jpg`

To replace the logo with a higher-resolution PNG, upload to:

https://github.com/nateadmin/gocha/upload/cursor/infisical-server-setup-f31e/mobile/gocha-app/assets/branding

Use filename `logo.png` (or update `HomeScreen.tsx` if you keep another name).

## Commands

- `npm start` — Metro bundler
- `npm run android` — Android build
- `npm run ios` — iOS build (macOS + Xcode)
- `npm test` — Jest
- `npm run lint` — ESLint

## API config

Planned host: `https://gocha.ai` in `src/config/api.ts`.

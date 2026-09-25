# Gocha mobile store release kit

Prepared listing copy, graphics, and build scripts for Google Play and the Apple App Store.

## App identity

| Field | Value |
| --- | --- |
| App name | Gocha |
| Android package | `com.gochaapp` |
| iOS bundle ID | `com.gochaapp` |
| Marketing version | `1.0.0` (see `version.json`) |
| Production API / web | https://app.gocha.ai/ |
| Marketing site | https://gocha.ai/ |
| Support email | support@gocha.ai |
| Privacy policy | https://gocha.ai/privacy |
| Terms of service | https://gocha.ai/terms |

## Folder layout

```
store/
  version.json
  google-play/
    listing/en-US/          # Play Console text fields
    graphics/               # 512 icon, 1024x500 feature graphic
    screenshots/phone/      # Phone screenshots (1080x1920 or larger)
  apple-app-store/
    metadata/en-US/         # App Store Connect text fields
    graphics/               # 1024 App Store icon
    screenshots/iphone-6.7/ # 1290x2796 screenshots
  privacy/                  # Data safety / privacy questionnaire notes
fastlane/                   # Optional upload automation
scripts/
  generate-store-assets.sh  # Regenerate icons + store graphics from Logo.jpeg
  build-android-release.sh  # Build signed AAB
  capture-store-screenshots.mjs
```

## Regenerate icons and graphics

From `mobile/gocha-app/`:

```bash
./scripts/generate-store-assets.sh
```

Source logo: `assets/branding/Logo.jpeg`.

## Android release (Google Play)

1. Create an upload keystore and store credentials in Infisical (never commit the keystore).
2. Copy `android/keystore.properties.example` to `android/keystore.properties` locally, or export env vars documented in that file.
3. Build the release bundle:

```bash
./scripts/build-android-release.sh
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

4. Upload the AAB in Play Console.
5. Paste listing text from `store/google-play/listing/en-US/`.
6. Upload `store/google-play/graphics/icon-512.png` and `feature-graphic.png`.
7. Upload phone screenshots from `store/google-play/screenshots/phone/`.
8. Complete the Data safety form using `store/privacy/data-safety-questionnaire.md`.

## iOS release (App Store)

Requires macOS with Xcode 16+ and an Apple Developer account.

1. Open `ios/GochaApp.xcworkspace` (run `pod install` in `ios/` first).
2. Set your Team in Signing & Capabilities for the `GochaApp` target.
3. Confirm bundle ID `com.gochaapp` is registered in App Store Connect.
4. Archive: Product → Archive → Distribute App → App Store Connect.
   Or use `fastlane ios release` after configuring `fastlane/Appfile`.
5. Upload metadata from `store/apple-app-store/metadata/en-US/`.
6. Upload `store/apple-app-store/graphics/app-icon-1024.png` if not embedded from Xcode.
7. Upload 6.7" screenshots from `store/apple-app-store/screenshots/iphone-6.7/`.
8. Complete App Privacy details using `store/privacy/app-privacy-details.md`.

## Screenshots

Capture fresh screenshots from production or a local web build:

```bash
npm run build:web
node scripts/capture-store-screenshots.mjs
```

Replace placeholders before final submission if flows change.

## Version bumps

Edit `store/version.json`, then sync:

- `package.json` → `version`
- `android/app/build.gradle` → `versionCode`, `versionName`
- Xcode target → `MARKETING_VERSION`, `CURRENT_PROJECT_VERSION`

Increment `androidVersionCode` on every Play upload. Increment `iosBuildNumber` on every App Store upload.

## Google Play review login

Reviewers use `google-review@gocha.ai` and the Infisical password. The password field must appear after they type that email on both Sign in and Create account. Do not remove this path.

# TestFlight upload checklist (Gocha iOS)

Bundle ID `com.gochaapp`. Version `1.0.0`, build number from `store/version.json`
(`iosBuildNumber`). Every upload needs a **higher build number** than the last.

## Before archiving
- [ ] `git checkout main && git pull` (must include PR #52).
- [ ] `cd mobile/gocha-app && npm ci`
- [ ] `cd ios && pod install` (commit `Podfile.lock` changes).
- [ ] Xcode is a **release** build (Xcode → About shows no "beta"). Apple rejects uploads from beta Xcode.
- [ ] Open `ios/GochaApp.xcworkspace` (not `.xcodeproj`).

## Xcode
- [ ] Target **GochaApp** → Signing & Capabilities: choose your Team, leave "Automatically manage signing" on.
- [ ] General → Version `1.0.0`, Build `1` (bump for each upload).
- [ ] Select **Any iOS Device (arm64)**, then Product → **Archive**.
- [ ] Organizer → **Distribute App** → App Store Connect → Upload.

## App Store Connect
- [ ] My Apps → New App → bundle ID `com.gochaapp`, name **Gocha**, SKU e.g. `gocha-ios`.
- [ ] TestFlight → the build appears after "Processing" (10–30 min). Answer the export-compliance prompt if shown (uses standard encryption only).
- [ ] Add internal testers (App Store Connect users) → they can install immediately.
- [ ] External testers need Beta App Review: fill **Test Information** with the notes in `REVIEW_NOTES.md`.
- [ ] App Privacy → follow `store/privacy/app-privacy-details.md`.
- [ ] App Information → Privacy Policy URL `https://gocha.ai/privacy`.

## Test on a real iPhone (TestFlight build)
- [ ] Sign in as `google-review@gocha.ai`; "Before you continue" appears and Continue works.
- [ ] Fully close and reopen the app: still signed in.
- [ ] Open a chat, send a message, open a status, no crash.
- [ ] Report a message, block someone, then unblock.
- [ ] Settings → AI features toggle, Privacy Policy, Terms, Delete account dialog (cancel it).
- [ ] No buttons that do nothing: attach/camera/mic and the Calls tab are intentionally hidden on iPhone.
- [ ] Menus close when you tap outside them.

## Before submitting for App Review (not needed for TestFlight)
- [ ] Real signed-in screenshots: iPhone 6.9" (1320×2868) or 6.5" (1284×2778).
- [x] iPhone only (`TARGETED_DEVICE_FAMILY = 1`): no iPad screenshots or iPad review needed.
- [ ] Add chats, a group and a status to the review account.
- [ ] Description and keywords: `metadata/en-US/` (already match the iOS build).

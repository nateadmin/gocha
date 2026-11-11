# App Store privacy details (Gocha 1.0, iOS)

Answers for App Store Connect → App Privacy. Checked against the code on `main`
(63d29c2): the iOS app has no analytics, crash-reporting or advertising SDKs, does
not read device location, contacts, photos, camera or microphone, and does not use
Firebase on iPhone (phone sign-in is web-only).

**Do you or your third-party partners collect data from this app?** Yes.

**Tracking:** No. Nothing is used to track users across other companies' apps or sites.

## Data types to declare

All are **linked to the user's identity**, **not used for tracking**.

| Category | Data type | Purpose | Notes |
|---|---|---|---|
| Contact Info | Email Address | App Functionality | Sign-in and account |
| Contact Info | Name | App Functionality | Display name entered in onboarding |
| Contact Info | Phone Number | App Functionality | Only if added on the web app; shown in the account |
| User Content | Other User Content | App Functionality | Profile bio, status text, profile cards, business listings |
| User Content | Messages (Emails or Text Messages) | App Functionality | Chat messages stored on our server |
| Identifiers | User ID | App Functionality | Account id |

## AI features (third-party processing)

Translation, Catch Up summaries and Gocha AI send message text to **OpenAI**.
This is **off by default**; each user turns it on in the "Before you continue"
screen or Settings → AI features. Messages are only processed when both people in
the conversation have opted in. Declare the Messages / Other User Content rows
above as shared with OpenAI for App Functionality, and keep the privacy policy
at https://gocha.ai/privacy saying so.

## Do NOT declare (not collected by the iOS build)

Location, Contacts, Photos or Videos, Audio, Health, Financial info, Browsing
history, Search history, Purchases, Diagnostics, Advertising data.

Revisit this list if native photo or voice upload, device location, analytics or
crash reporting is added.

## Other App Store Connect answers

- **Privacy Policy URL:** https://gocha.ai/privacy
- **Support URL:** https://gocha.ai (support@gocha.ai)
- **Age rating questionnaire:** "Unrestricted Web Access" = **No** (the app has no
  browser). "User-Generated Content / Messaging and Chat" = **Yes**. The in-app rules
  forbid objectionable content, and the app has report, block, a word filter and
  account deletion. Expect a 12+ or 17+ rating depending on the other answers.
- **Export compliance:** the app only uses standard HTTPS. `ITSAppUsesNonExemptEncryption`
  is already `false` in Info.plist, so Apple will not ask on each upload.
- **Content rights:** the app contains no third-party content you do not own.

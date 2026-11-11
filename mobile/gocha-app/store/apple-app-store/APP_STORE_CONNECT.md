# Gocha: App Store Connect content (copy and paste)

Everything for the first iOS release, field by field. Text files in `metadata/en-US/`
hold the same values. Screenshots are in `screenshots/iphone-6.9/`.

---

## 1. New App (My Apps → +)

| Field | Value |
|---|---|
| Platform | iOS |
| Name | `Gocha` |
| Primary language | English (U.S.) |
| Bundle ID | `com.gochaapp` |
| SKU | `gocha-ios` |
| User access | Full access |

## 2. App Information

| Field | Value |
|---|---|
| Subtitle (30) | `Chat, Catch Up, and Discover` |
| Category, primary | Social Networking |
| Category, secondary | Productivity |
| Content rights | Does not contain, show, or access third-party content |
| Age rating | See section 6 |
| Privacy Policy URL | `https://gocha.ai/privacy` |

## 3. Pricing and Availability

Price: **Free**. Availability: all countries (or match Google Play).

## 4. App Privacy

Follow `../privacy/app-privacy-details.md`:
- Collect data: **Yes**. Tracking: **No**.
- Email Address, Name, Phone Number, Other User Content, Messages, User ID →
  linked to user, App Functionality, not tracking.
- Do not declare location, contacts, photos, audio, diagnostics, purchases.

## 5. Version 1.0.0 page

**Screenshots, iPhone 6.9" display (1320 × 2868):** upload in this order from
`screenshots/iphone-6.9/`: `01-chats`, `02-discover`, `03-status`, `04-profile-cards`.
Apple scales them down for smaller iPhones automatically.

**Promotional Text (170):**
```
Message friends, groups, and businesses in one inbox. Get AI briefings of what you missed and discover local groups near you.
```

**Description (4000):** paste `metadata/en-US/description.txt`.

**Keywords (100):**
```
chat,messenger,groups,business,ai assistant,summary,catch up,local,community,status,profile,social
```

**Support URL:** `https://gocha.ai`
**Marketing URL (optional):** `https://gocha.ai`
**Version:** `1.0.0`
**Copyright:** `2026 Gocha LLC`
**What's New:** not shown for the first version; leave empty.

**Build:** select the TestFlight build once it has finished processing.

## 6. Age Rating questionnaire

- Unrestricted Web Access: **No**
- User-Generated Content / Messaging and Chat: **Yes**
- Gambling, contests, mature themes, violence, sexual content, medical, alcohol, drugs: **None**
- Expected result: **12+** (Google Play rates it 12+ too).

## 7. App Review Information

| Field | Value |
|---|---|
| Sign-in required | Yes |
| User name | `google-review@gocha.ai` |
| Password | from Infisical `GOCHA_REVIEW_LOGIN_PASSWORD` (ask the backend developer) |
| Contact | your name, phone, `support@gocha.ai` |

**Notes:** paste `REVIEW_NOTES.md` (sections "Notes for the reviewer" onward).

## 8. TestFlight

**Test Information → Beta App Description:**
```
Gocha brings messaging, AI catch-up briefings, and local discovery into one app. This build is the first iOS release candidate.
```

**What to Test:**
```
Sign in with the test account, accept the community rules, and try: sending messages, opening a status, reporting and blocking from a chat, the AI features switch in Settings, and closing and reopening the app (you should stay signed in).
```

**Feedback email:** `support@gocha.ai`
**Sign-in info for external testers:** same as section 7.

## 9. Export compliance

Already answered in the app (`ITSAppUsesNonExemptEncryption = NO`). If asked: uses
standard encryption only (HTTPS) → exempt.

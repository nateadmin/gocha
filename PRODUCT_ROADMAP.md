# Gotcha product roadmap alignment

Source: Gotcha Product Roadmap (product PDF in repo uploads). Product name: Gotcha. Repo, domain, and package use `gocha`.

## Phase 1 — Gotcha Messaging App

### Build 1 — Core messaging and community

| Roadmap item | Repo status | Where |
| --- | --- | --- |
| Personal and business messaging in one app | Shell + mock | `ChatsTab`, business chats flagged in `mock.ts` |
| Business profile activation + verification docs | Not built | Needs onboarding flow + document upload (file-handling standard) |
| Status updates | Shell entry | Status control on Chats header (Build 1.1 UI) |
| AI Catch Up (summaries, highlights) | Shell + mock | `CatchUpTab`, `briefingText`, attention items |
| OpenAI/ChatGPT until proprietary AI | Documented | Catch Up footer note; Settings AI toggle |
| Around Me / Nearby discoverable groups | Shell + mock | Discover → Around Me |
| Join requests; admin approve/decline | Shell | Request to join button (API pending) |
| Discoverable vs private group privacy | Documented in UI | Discoverable badge + private-group note |

### Build 2 — Business commerce and connectors

| Roadmap item | Repo status | Where |
| --- | --- | --- |
| Businesses operate in-app (menu, orders) | Shell + mock | Discover → Businesses, menu detail |
| AI order assistant (chat-first commerce) | Shell | AI Order Assistant card |
| Transaction / service fees | Not built | Backend pricing + payments |
| External connectors (e.g. Rydit) | Planned | `PLATFORM_MAP.txt`, README integration note |
| Search, order, pay, status updates | Partial | Search + menu UI; pay/order API pending |

### Build 3 — Collective and proprietary AI

| Roadmap item | Repo status | Where |
| --- | --- | --- |
| Gotcha Collective account link | Stub | Settings Collective section |
| Member discounts in app | Not built | Build 3 |
| Proprietary AI vs third-party | Not built | Replace Catch Up provider in Build 3 |

## Phase 2 — Gotcha Collective

Standalone website + email offers first; app linkage in Build 3. Not started in this repo.

## Phase 3 — The Phone

Long-term handset ecosystem. Not in scope now. Messaging, commerce, Collective, and AI choices should stay phone-ready (API-first, no hardcoded device assumptions).

## Mobile navigation (maps to roadmap + wireframes)

| Tab | Roadmap | Notes |
| --- | --- | --- |
| Chats | Build 1 messaging | Personal, group, and business threads |
| Catch up | Build 1 AI | Conversation summaries |
| Discover | Build 1 Around Me + Build 2 Businesses | Two sections in one tab |
| Calls | Messaging companion | Voice/video shell |
| Settings | Cross-cutting | Privacy, notifications, AI, Collective stub |

## Backend (Laravel `app_gocha/`)

Current: health + version only. Next API work should follow roadmap order: auth + messaging (Build 1), then commerce connectors (Build 2), then Collective + AI swap (Build 3).

## Out of scope for current shell

- Real payments, order state machines, verification document storage
- Live OpenAI calls (use server-side slots; secrets in Infisical only)
- Collective website (Phase 2)
- Phone hardware (Phase 3)

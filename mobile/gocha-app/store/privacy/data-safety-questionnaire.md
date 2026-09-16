# Google Play Data safety (Gocha 1.0)

Use this as a draft when completing the Play Console Data safety form. Confirm against the live app before publishing.

## Data collected

| Data type | Collected | Shared | Purpose | Optional |
| --- | --- | --- | --- | --- |
| Email address | Yes | No | Account creation, sign-in | No |
| Phone number | Yes | No | Account creation, sign-in | No |
| Name / display name | Yes | No | Profile, chat display | No |
| User IDs | Yes | No | Authentication, messaging | No |
| Photos / videos | Yes | No | Status updates, chat media, profile cards | Yes |
| Messages | Yes | No | Core messaging feature | No |
| App interactions | Yes | No | Product analytics and reliability | No |
| Crash logs | Yes | No | Stability | No |

## Data not sold

Gocha does not sell user data.

## Encryption

Data is transmitted over HTTPS. Messages and account data are stored on Gocha servers.

## Deletion

Users can request account and data deletion via support@gocha.ai. Document the in-app or web deletion path before final submission if added.

## Third-party SDKs

- Firebase (phone authentication)
- OpenAI (Catch Up summaries and Gocha AI replies; message content sent for processing)
- Google Places (address autocomplete for business listings)

Review each SDK's data handling in Play Console linked services.

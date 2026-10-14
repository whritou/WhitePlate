# K2 KDS operational features verification

**Status:** implemented in source; project card remains In Review until browser acceptance is recorded.

## Implemented

- Live Orders and the dashboard's active tickets show elapsed time and the countdown to the saved pickup instant. The API returns `serverTime` from before each order-list read; the browser advances that reference with monotonic time, so device clock skew does not reset timers. Completed and cancelled tickets have no active urgency timer.
- Pickup is due soon at five minutes or less and overdue at or past the pickup instant. Text and icons accompany the semantic color states; there is no motion.
- Order sound is muted by default, becomes active only after a user gesture, and is scoped to the mounted board session. A new-order sound and polite screen-reader announcement fire only for a deduplicated `order.created` event newer than the latest REST snapshot.
- Staff order summary/history lines include saved localized preparation notes along with the existing preparation-minute estimate. Tickets choose a note for the saved menu locale first and fall back to the interface locale. The estimate remains guidance, not a ready-time promise.

## Decisions and limits

- Resolved 2026-10-14: use API server time, saved UTC `createdAt`, and saved S3 `pickupAt`; use a five-minute due-soon threshold; default sound to muted and keep preference only for the mounted board session.
- No countdown is derived from `preparationMinutes`, because M2 metadata is an estimate and the order model has no authoritative preparation target.
- Persistent preparation stages, stations, and pickup shelves are deferred. The order/API model has no corresponding state or approved edit roles/concurrency contract. D3 rush state is not wired to the live order runtime, so there is no rush-adjusted deadline. The existing M2 database migration and deployment gates remain unchanged.
- No schema migration was added for K2. The API response now includes `serverTime`; deploy the frontend and API contract together.

## Verification

- `node node_modules/vitest/vitest.mjs run` — passed: 80 files, 511 tests.
- `node node_modules/typescript/bin/tsc --noEmit` — passed.
- `node node_modules/eslint/bin/eslint.js .` — passed with 19 existing `<img>` optimization warnings in unrelated Lovable components.
- `dotnet test apps/api/WhitePlate.slnx --no-restore -p:BaseOutputPath=apps/api/tests/WhitePlate.Tests/bin/kds-isolated/` — passed: 258 tests. The isolated output kept the running API's `bin` directory untouched and remained below `apps/api` so architecture tests could find source projects.
- Changed frontend `.ts`, `.tsx` and `.json` files: Prettier check passed.
- `node node_modules/next/dist/bin/next build --webpack` — passed from an isolated source copy with inert `.invalid` service URLs and placeholder auth/mail settings. The shared checkout's `.next` was locked by the running frontend, so the copy kept build output separate. Better Auth logged the expected schema-validation failures against the deliberately unreachable placeholder database; route compilation, page generation and production build completed.

## Remaining acceptance

- Complete a browser walkthrough for EN/FR, sound permission/failure and mute, refresh/reconnect deduplication, keyboard/touch, reduced motion, 200% zoom, and the K1 viewport matrix. Keep the project card In Review until that is recorded.
- Do not add stage/station/shelf controls or preparation countdowns until their authoritative model and permissions are designed. Revisit rush-adjusted pickup urgency only when D3 is connected to the live API.

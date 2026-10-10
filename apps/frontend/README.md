# WhitePlate frontend

The approved Lovable design now also covers real workspaces, tenant customer shells and account screens. See [real routes, connected operations and explicit fictitious drafts](../../docs/lovable-live-workspace.md). Existing backend contracts are retained; hosted acceptance remains separate.

The public landing and localized demo routes use the supplied Lovable design. See [migration documentation](../../docs/lovable-migration.md) for route mapping, local fonts/assets and backend connections. Demo actions are browser simulations; they do not replace real tenant services. Run `npm run test:browser -- --project lovable-migration` against `WHITEPLATE_ACCEPTANCE_URL=http://localhost:3015` after starting a local server.

Next.js App Router app with localized Better Auth and organization/team flows, tenant menu browsing, language/translation settings, and guest cart/checkout. Protected API operations use server-side Better Auth JWTs. Guest checkout uses a same-origin public BFF and an in-memory cart; server receipt pricing and retry safety are verified with a local API fixture. Kitchen tickets use TanStack Query reads/action mutations and SignalR invalidation hints. Live authenticated dashboard acceptance remains separately tracked.

Run from this directory:

```sh
npm ci
npm run dev
```

Open `/en` or `/fr` on `http://localhost:3000`. Press `d` outside text-entry controls to switch themes.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Webpack development server |
| `npm run build` | Production Webpack build; bundled local fonts with system fallbacks, no Google font fetch |
| `npm run start` | Serve a completed production build |
| `npm run lint` | ESLint with the Next.js React plugin's legacy context API adapted for ESLint 10 |
| `npm run test` | Run Vitest unit tests, including the shared API request factory |
| `npm run auth:dev-token` | Print a 15-minute API bearer token for local Swagger testing using the test account in `.env.local` |
| `npm run typecheck` | TypeScript check without emitted JavaScript |
| `npm run format` | Rewrite all matching TS/TSX files with Prettier; not a read-only check |
| `npm run format:check` | Read-only formatting check, also required by CI |

Vitest uses `vitest.config.ts` for the frontend alias and browser-test exclusion. Playwright is installed but has no browser-test configuration yet. Local/CI references are Node 24.19.0 (`.nvmrc`) and npm 11.17.0 (`packageManager`). `npm ci` enforces compatible Node 24/npm 11 ranges from those minimums, permitting Vercel's rolling minor/patch updates while rejecting unsupported majors. `.npmrc` retains the Next.js React plugin peer dependency until its metadata accepts ESLint 10; `@eslint/compat` adapts its legacy rule context. The root `global.json` selects the supported .NET 10 feature band for API tests. The GitHub Actions workflow runs these checks from a clean checkout.

On a fresh checkout, copy `.env.example` to `.env.local` and configure the PostgreSQL database and provider credentials. Better Auth's separate `auth` schema is migrated on the Neon test branch; for another database, run `npm run auth:migrate`. The API also needs `Authentication__Issuer=http://localhost:3000` and `Authentication__Audience=whiteplate-api` locally. Production requires HTTPS and all Better Auth/Google/Microsoft/Resend settings; see the [authentication setup](../../docs/development.md#authentication-configuration).

For this checkout's Neon test branch, `.env.local` contains an ignored `WHITEPLATE_DEV_EMAIL` and `WHITEPLATE_DEV_PASSWORD` for the verified `local-tester@whiteplate.invalid` account. With the frontend running, run `npm run auth:dev-token`, copy its JWT, and paste it into Swagger's **Authorize** Bearer field. The .NET API has no password-login route; Better Auth handles sign-in. The test account has no organization membership until one is created through the app.

The hosted main stack is being moved to Coolify PostgreSQL and API while the frontend stays on Vercel. `DATABASE_SSL_CA` supplies a server-only CA PEM for certificate/hostname verification; omit SSL query parameters from `DATABASE_URL` when using it. `PUBLIC_API_BASE_URL` is the browser-reachable SignalR origin, never a database credential. Keep Preview and local Neon settings separate. See the [deployment runbook](../../docs/deployment/coolify.md) for migration status and exact settings.

Auth URLs: `/[locale]/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/verify-email`, `/organization/sign-up`, `/organization`, `/organization/team`, and `/invitations/accept`. Better Auth handlers are at `/api/auth/*`.

Read [frontend agent instructions](AGENTS.md) before changing Next.js code. See the [frontend architecture](../../docs/architecture/WHITEPLATE_FRONTEND_ARCHITECTURE.md), [development guide](../../docs/development.md), and [review findings](../../docs/documentation-review.md).

Source lives directly in this directory, and `@/*` resolves here. Add translated text to both `messages/en.json` and `messages/fr.json`. Use navigation helpers from `@/i18n/navigation` for localized app links. Extend the existing `components/ui/button.tsx` when appropriate; do not regenerate it just to use it. Component-generation settings are in `components.json`.

Remaining operational and account screen recipes now follow the restored Lovable export; see [routes, source mapping and backend limitations](../../docs/lovable-live-workspace.md#remaining-screens-and-restored-source--10-october-2026). Run the `lovable-remaining` Playwright project against a local development server for the new presentation checks.

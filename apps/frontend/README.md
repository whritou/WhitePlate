# WhitePlate frontend

Next.js App Router app with localized Better Auth and organization/team flows, tenant menu browsing, language/translation settings, and guest cart/checkout. Protected API operations use server-side Better Auth JWTs. Guest checkout uses a same-origin public BFF and an in-memory cart; server receipt pricing and retry safety are verified with a local API fixture. The kitchen dashboard remains unimplemented.

Run from this directory:

```sh
npm ci
npm run dev
```

Open `/en` or `/fr` on `http://localhost:3000`. Press `d` outside text-entry controls to switch themes.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Webpack development server |
| `npm run build` | Production Webpack build; uses system font stacks and does not fetch Google fonts |
| `npm run start` | Serve a completed production build |
| `npm run lint` | ESLint with the Next.js React plugin's legacy context API adapted for ESLint 10 |
| `npm run test` | Run Vitest unit tests, including the shared API request factory |
| `npm run auth:dev-token` | Print a 15-minute API bearer token for local Swagger testing using the test account in `.env.local` |
| `npm run typecheck` | TypeScript check without emitted JavaScript |
| `npm run format` | Rewrite all matching TS/TSX files with Prettier; not a read-only check |

Vitest runs without a separate configuration file. Playwright is installed but has no browser-test configuration yet. `npm ci` requires the exact Node/npm versions pinned by `.nvmrc` and `package.json`. `.npmrc` retains the Next.js React plugin peer dependency until its metadata accepts ESLint 10; `@eslint/compat` adapts its legacy rule context. The root `global.json` selects the supported .NET 10 feature band for API tests. The GitHub Actions workflow runs these checks from a clean checkout.

On a fresh checkout, copy `.env.example` to `.env.local` and configure the PostgreSQL database and provider credentials. Better Auth's separate `auth` schema is migrated on the Neon test branch; for another database, run `npm run auth:migrate`. The API also needs `Authentication__Issuer=http://localhost:3000` and `Authentication__Audience=whiteplate-api` locally. Production requires HTTPS and all Better Auth/Google/Microsoft/Resend settings; see the [authentication setup](../../docs/development.md#authentication-configuration).

For this checkout's Neon test branch, `.env.local` contains an ignored `WHITEPLATE_DEV_EMAIL` and `WHITEPLATE_DEV_PASSWORD` for the verified `local-tester@whiteplate.invalid` account. With the frontend running, run `npm run auth:dev-token`, copy its JWT, and paste it into Swagger's **Authorize** Bearer field. The .NET API has no password-login route; Better Auth handles sign-in. The test account has no organization membership until one is created through the app.

Auth URLs: `/[locale]/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/verify-email`, `/organization/sign-up`, `/organization`, `/organization/team`, and `/invitations/accept`. Better Auth handlers are at `/api/auth/*`.

Read [frontend agent instructions](AGENTS.md) before changing Next.js code. See the [frontend architecture](../../docs/architecture/WHITEPLATE_FRONTEND_ARCHITECTURE.md), [development guide](../../docs/development.md), and [review findings](../../docs/documentation-review.md).

Source lives directly in this directory, and `@/*` resolves here. Add translated text to both `messages/en.json` and `messages/fr.json`. Use navigation helpers from `@/i18n/navigation` for localized app links. Extend the existing `components/ui/button.tsx` when appropriate; do not regenerate it just to use it. Component-generation settings are in `components.json`.

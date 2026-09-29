# WhitePlate frontend

Next.js App Router app with localized Better Auth sign-in/sign-up, password recovery, Google/Microsoft OAuth, verified-email organization signup, and staff invitation/team flows. Authenticated API operations run through Next.js server actions and use Better Auth's short-lived JWTs. Restaurant catalog/order screens are not implemented.

Run from this directory:

```sh
npm ci
npm run dev
```

Open `/en` or `/fr` on `http://localhost:3000`. Press `d` outside text-entry controls to switch themes.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build; may require network access for Google fonts |
| `npm run start` | Serve a completed production build |
| `npm run lint` | ESLint; see the known baseline failure in the review findings |
| `npm run test` | Run Vitest unit tests, including the shared API request factory |
| `npm run typecheck` | TypeScript check without emitted JavaScript |
| `npm run format` | Rewrite all matching TS/TSX files with Prettier; not a read-only check |

Vitest runs without a separate configuration file. Playwright is installed but has no browser-test configuration yet.

Copy `.env.example` to `.env.local` and configure the PostgreSQL database and provider credentials. Better Auth's separate `auth` schema is migrated on the Neon test branch; for another database, run `npm run auth:migrate`. The API also needs `Authentication__Issuer=http://localhost:3000` and `Authentication__Audience=whiteplate-api` locally. Production requires HTTPS and all Better Auth/Google/Microsoft/Resend settings; see the [authentication setup](../../docs/development.md#authentication-configuration).

Auth URLs: `/[locale]/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/verify-email`, `/organization/sign-up`, `/organization`, `/organization/team`, and `/invitations/accept`. Better Auth handlers are at `/api/auth/*`.

Read [frontend agent instructions](AGENTS.md) before changing Next.js code. See the [frontend architecture](../../docs/architecture/WHITEPLATE_FRONTEND_ARCHITECTURE.md), [development guide](../../docs/development.md), and [review findings](../../docs/documentation-review.md).

Source lives directly in this directory, and `@/*` resolves here. Add translated text to both `messages/en.json` and `messages/fr.json`. Use navigation helpers from `@/i18n/navigation` for localized app links. Extend the existing `components/ui/button.tsx` when appropriate; do not regenerate it just to use it. Component-generation settings are in `components.json`.

# WhitePlate frontend

Next.js App Router scaffold with English/French pages, Tailwind CSS 4, a Base UI button, and a light/dark theme. Restaurant features and API integration are not implemented.

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
| `npm run typecheck` | TypeScript check without emitted JavaScript |
| `npm run format` | Rewrite all matching TS/TSX files with Prettier; not a read-only check |

No `test` script or test configuration exists yet. Playwright and Vitest are installed but unused.

Read [frontend agent instructions](AGENTS.md) before changing Next.js code. See the [frontend architecture](../../docs/architecture/WHITEPLATE_FRONTEND_ARCHITECTURE.md), [development guide](../../docs/development.md), and [review findings](../../docs/documentation-review.md).

Source lives directly in this directory, and `@/*` resolves here. Add translated text to both `messages/en.json` and `messages/fr.json`. Use navigation helpers from `@/i18n/navigation` for localized app links. Extend the existing `components/ui/button.tsx` when appropriate; do not regenerate it just to use it. Component-generation settings are in `components.json`.

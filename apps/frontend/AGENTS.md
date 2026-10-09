<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## WhitePlate frontend rules

The canonical design system includes an approved scoped Lovable reference for the public landing and `/[locale]/demo` only. Follow [its migration documentation](../../docs/lovable-migration.md) for source tokens/assets, browser-only state and remaining backend connections. Do not extend that scoped palette to live screens without an explicit design change. Existing Culinary Commerce rules below remain the default elsewhere.

Read [frontend architecture](../../docs/architecture/WHITEPLATE_FRONTEND_ARCHITECTURE.md) and [implementation conventions](../../docs/architecture/frontend-conventions.md) before edits. The latter defines the implemented module ownership and request/query lifecycle.

- For every UI task, also read the [design system](../../docs/design-system/README.md) and [canonical tokens](../../docs/design-system/tokens.json) before editing. They define the Culinary Commerce identity, component states, screen recipes and delivery checklist, including light/dark, FR/EN, keyboard, responsive and product-specific error/retry states. Adopt it within the requested scope; do not hard-code colors or local radius overrides as new defaults. Centralize shared variants in `components/ui` and semantic tokens in `app/globals.css` when implementation is requested. Report which rules were applied, any remaining deviations, and actual verification. Agent instructions and review enforce design adherence; no automatic visual compliance is claimed.
- Reuse `components/ui` shadcn Base UI controls and surfaces, including Card/Header/Title/Description/Content/Footer, Alert/Description and Badge. Inspect their APIs rather than assuming Radix props. Keep accessible semantic headings and lists inside those components.
- Export named types/interfaces from `types/<area>.ts` and import them with `import type`.
- Keep actions in `actions/` as validated mutation adapters. Use server-only `services/` for feature operations, shared HTTP adapters for requests, and pure runtime parsers for untrusted values.
- All application HTTP uses `lib/api/json-request-client.ts` for JSON serialization, headers, safe errors and request policy. Browser BFF calls use `browserRequest(path, { signal })`; API adapters use `createApiRequestFactory` for origin/path validation and server token acquisition. Do not repeat fetch options at call sites.
- Use TanStack Query for interactive server state; keep keys scoped to account, tenant, locale and view. Keep transient cart/form state local. A browser tenant selector is never authorization.
- Keep files focused and formatted. Separate logical statements and JSX blocks with blank lines. ESLint enforces spacing, shared controls, type placement, request boundaries, a 350-line application-file limit and an 80-line function limit in lib/actions/services (excluding blank lines/comments; tests exempt).
- Run tests, lint, typecheck, `format:check` and build as appropriate. Preserve both translation catalogs and record checks that could not run.

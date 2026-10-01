<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## WhitePlate frontend rules

Read [frontend architecture](../../docs/architecture/WHITEPLATE_FRONTEND_ARCHITECTURE.md) and [implementation conventions](../../docs/architecture/frontend-conventions.md) before edits. The latter defines the implemented module ownership and request/query lifecycle.

- Reuse `components/ui` shadcn Base UI controls; inspect their APIs rather than assuming Radix props. Keep semantic HTML for layout.
- Export named types/interfaces from `types/<area>.ts` and import them with `import type`.
- Keep actions in `actions/` as validated mutation adapters. Use server-only `services/` for feature operations, shared HTTP adapters for requests, and pure runtime parsers for untrusted values.
- Use TanStack Query for interactive server state; keep keys scoped to account, tenant, locale and view. Keep transient cart/form state local. A browser tenant selector is never authorization.
- Keep files focused and formatted. ESLint enforces shared controls, type placement, request boundaries and a 350-line application-file limit.
- Run tests, lint, typecheck, `format:check` and build as appropriate. Preserve both translation catalogs and record checks that could not run.

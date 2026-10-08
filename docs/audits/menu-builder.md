# M1 — Combined Menu Builder & Translations

8 October 2026. Source implementation with local verification; shared-database and hosted acceptance remain open. The project card stays In review until those checks complete.

## Implemented behavior and decisions

`/[locale]/organization/catalog?tenantId=…&view=products|translations` is the shared restaurant workspace. The sidebar has one Menu Builder & Translations entry. Old `restaurant-languages` bookmarks redirect to `catalog` with `view=translations`, preserving tenant and repeated query values. Existing catalog bookmarks remain valid. App EN/FR and restaurant menu languages remain separate.

The supplied Stitch composition becomes a category rail, product picker, selected-product editor and option/modifier panels; the language tab reuses enabled/default-language management, original/saved/missing/fallback translation presentation and restaurant descriptions. Discounts remain a named action opening the existing editor. Category and product display-order inputs reuse persisted sort operations and provide keyboard ordering. Temporary category hiding has its own action and semantic status, separate from archive.

Product saves are explicit per product. Visited product editors stay mounted across category/product/tab switches, retaining unsaved input. Discard resets to the latest server product and returns focus to its name. Description drafts are held per menu language. Dialog Cancel/Escape discards that dialog's draft; failed writes retain it and pending writes prevent dismissal. Product save and visibility writes lock workspace selection and use synchronous duplicate guards. Local drafts do not survive a full reload, account/tenant change or leaving the route. The workspace is keyed by account and tenant; no browser persistence or new authenticated client cache is introduced.

The API adds category `isVisible` to management reads and `PUT /api/v1/tenants/{tenantId}/categories/{categoryId}/visibility`. Persisted owner/manager membership is required on every request. Public menu reads exclude hidden categories. Checkout rechecks the same tenant's active, visible category and rejects stale carts containing its products. Showing a category preserves individual product availability and archive flags.

## Design comparison

Reference: supplied `menu-builder.html` and `menu-builder.png`, treated as design evidence. WhitePlate branding, two-tab hierarchy, category rail, selected-product card and separate option-group surface are retained. Panels stack on smaller screens; controls wrap instead of clipping. The first implementation retained too much of the earlier stacked forms and was corrected after user feedback. The final header aligns the title with the tab bar, categories use compact rows with a dark selection and eye controls, the product picker moves into the rail, pricing fields share a row, and modifier groups use tinted cards with white option rows and compact edit/archive controls. Field surfaces are muted, with a visible bottom boundary and keyboard focus ring. The retained shared shell supplies WhitePlate branding and active navigation. Canonical orange actions replace the export’s older rust action color; no competing global palette is introduced. Shared design-system tokens remain unchanged. Tablet control targets are scoped to this workspace and its portalled dialogs, with a 48px minimum; phone controls retain the shared 44px minimum.

M2–M5 controls (photos, SKU/preparation/allergen metadata, assisted translation, publication and history) are deliberately absent because their services are outside M1. No operational sync indicator or fake publishing action is added.

Captured comparison evidence:

- [French desktop, light](assets/menu-builder/desktop-fr-light.png)
- [French phone, dark](assets/menu-builder/mobile-fr-dark.png)
- [English translations, light](assets/menu-builder/translations-en-light.png)

## Verification

Commands run from `apps/frontend` with bundled Node 24.19, except API commands from the repository root:

- `npm test`: 59 files, 399 tests passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed after correcting JSX spacing in the new workspace.
- `node node_modules/@playwright/test/cli.js test --project=menu-builder --project=catalog-design`: 18 local fixture tests passed, including responsive checks inside the actual workspace shell. Covers draft switches, save failure/retry, pending/duplicate submission, archived controls, discounts, keyboard tabs and dialog focus. Save acknowledgements are simulated and are not persistence evidence.
- Responsive coverage: 320, 375, 390, 768, 1024, 1440 and 1920px; EN/FR, light/dark, reduced motion, 200% root text size, document overflow and tablet save-target sizing.
- `dotnet test apps/api/WhitePlate.slnx`: 168 passed. New HTTP/SQLite integration cases verify persisted hide/read-back/show, public filtering, stale checkout denial, authenticated owner/manager authorization, foreign tenants, revoked membership, malformed input and archived categories. Existing locale fallback coverage remains green.
- `dotnet ef migrations has-pending-model-changes --project apps/api/WhitePlate.Infrastructure --startup-project apps/api/WhitePlate.Api`: passed, no model changes.

TDD failures were observed before visibility/workspace implementation and corrected. The schema test's historical exact migration count was updated to assert the new column, migration and model alignment. One browser assertion initially matched Next's route announcer as well as the application alert; it now scopes the application group. A lint spacing error in the new browser test was corrected. After adding the reference language-count badge, four responsive cases exposed intrinsic-width overflow at 200% text size. The tab, rail and group headings now wrap correctly; the responsive retest passed in all four locale/theme combinations before the final full sweep. These are resolved checks, not waivers.

The initial production build stopped on the existing local HTTP auth URL, as required by the production guard. `npm run build` then passed with process-only `BETTER_AUTH_URL=https://whiteplate-build.invalid` and `API_BASE_URL=https://whiteplate-api-build.invalid`; no env file was edited or external service deployed. The build emits the existing pg SSL-mode compatibility warning.

`npm run format:check` failed on 187 existing files initially; formatting the three touched files reduced this to 184 untouched files. All changed/new TS/TSX files pass a scoped Prettier check. The untouched baseline is retained rather than reformatted as part of M1. `git diff --check` passes.

## Rollout and remaining acceptance

`20261008195344_CategoryVisibility` adds required `MenuCategories.IsVisible`, default `true` for existing rows. Generated migration and snapshot are included in this change; no shared/production migration or deployment was performed. Review/apply outstanding migrations, deploy API, then frontend: the management parser intentionally requires `isVisible` and will reject an old API response.

Authenticated catalog and discount browser scenarios are updated for the workspace, but were not run against the guarded acceptance database. Complete real browser save/reload, old-bookmark redirect, restored/archive controls and public locale fallback on that environment, then hosted checks and visual review with real restaurant data. SQLite persistence tests and intercepted browser saves are reported separately above. No production membership or availability acceptance is claimed by fixture screenshots.

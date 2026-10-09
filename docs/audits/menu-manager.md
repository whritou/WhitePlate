# Menu manager — 9 October 2026

User-approved scope: one-page table management of products, categories, extras and translations. The user explicitly removed WYSIWYG and selected a right-side product sheet because navigation occupies the left. Source implementation; hosted acceptance remains separate.

## Behavior

- Page-level New product/New category actions. New product remains enabled for an empty catalog.
- Search and active/archived/all filters combine with all created category filters. A product under an archived category is treated as archived.
- Products and categories use semantic tables with explicit numeric display-order saves. Lower numbers appear first; products sort within their category. Equal orders retain stable identifier ordering.
- Product names open a right-side sheet with complete plain-text description, category, price/tax, availability, edit/archive/restore actions, photos, extras and scoped product/group/option translation tables. Category translations and menu-language/restaurant-description settings remain in the page's translations tab. Discounts remain accessible.
- Product creation/editing selects an active category or creates one in context. A successful category mutation returns its validated ID and is immediately selected; product fields remain intact. Failed category writes retain input. Nested portal submissions stop propagation so they cannot submit the parent product form.
- Closing/reopening or switching products/tabs retains product/photo drafts for the account/tenant workspace. Discard restores the latest saved product; Cancel in the product form clears that product draft. Nested dialog Cancel/Escape clears only that dialog's input. Full navigation/reload discards local drafts. Pending writes disable workspace/sheet selection and dismissal; failed saves remain recoverable.
- Existing option selection rules, prices/order, archiving, language fallback distinctions, category visibility, discounts, photos and product restore rules are retained. Restoring a product does not restore archived options or automatically enable availability.

## API and storage

Product `PUT` accepts optional `categoryId`. Omitted/null preserves the existing assignment for older callers. The repository checks persisted owner/manager access through the existing handler and same-tenant, nonarchived current/target categories before updating. Missing/foreign/archived/empty UUID targets return the same `404` and preserve existing product fields. Reassignment changes the existing FK; no schema migration, new cache or credential exposure is added. Deploy API before frontend to avoid an older API silently ignoring category selection.

## Design and verification

Canonical Culinary Commerce tokens and shared Base UI controls are reused. No palette/token deviations were introduced. Table scrollers establish a positioning context for absolute accessibility labels and compact actions. Sheets respect their hidden state while retaining mounted drafts, wrap long content, and keep table overflow local. Both themes, EN/FR, keyboard focus, reduced motion, 44px phone/48px tablet controls and 200% text zoom are covered by browser fixtures.

Checks used bundled Node 24.19 and the frontend package's installed dependencies. Commands ran from `apps/frontend` unless otherwise stated:

- `npm test`: 66 files, 429 tests passed.
- `npm run lint` and `npm run typecheck`: passed.
- `npm run build`: passed with process-only HTTPS placeholders for `BETTER_AUTH_URL` and `API_BASE_URL`; no environment files changed. The installed PostgreSQL connection-string package emitted its existing SSL-mode compatibility warning.
- `node node_modules/@playwright/test/cli.js test --project=menu-builder --project=product-photos --project=catalog-design`, with `WHITEPLATE_ACCEPTANCE_URL=http://localhost:3012`: 68 tests passed against development fixtures. A final six-test responsive/photo sweep passed after the last copy/control-size refinements.
- From repository root, `dotnet test apps/api/WhitePlate.slnx`: 194 tests passed, including persisted category reassignment and rejected foreign/archived/missing targets.
- Prettier check of every changed/new frontend TypeScript file: passed. `npm run format:check` still fails on 165 untouched baseline files; those files were not reformatted as part of this feature.
- `git diff --check`: passed.
- From repository root, `py -3 docs/design-system/verify.py`: passed (119 contrast pairs, runtime/token and palette parity, 10 documentation link scans).

The initial category-reassignment regression failed before backend implementation. Browser checks exposed nested portal submission and narrow-screen table overflow; both were fixed and verified in the passing suite. Guarded real-database and hosted acceptance were not run.

Screenshots: [desktop table](assets/menu-manager/table-fr-light-1440.png), [desktop sheet](assets/menu-manager/sheet-fr-light-1440.png), [phone dark sheet](assets/menu-manager/sheet-fr-dark-390.png), [desktop photos](assets/menu-manager/photo-fr-light-1440.png), [phone dark photos](assets/menu-manager/photo-en-dark-390.png).

## Remaining acceptance and kanban

No deployment or shared database migration was performed. Repeat full menu creation, ordering/public-menu read-back, extras/translation saves, archive/restore and cross-tenant checks in the explicitly guarded non-production acceptance environment, then hosted acceptance.

The required project-board lookup was attempted. Browser tooling could not start because of the sandbox helper failure; GitHub CLI was absent. Automatic approval review initially rejected using the stored GitHub credential without explicit authorization. After the user authorized that authentication method, GitHub rejected Projects queries because the token has `repo`, `gist` and `workflow`, but no Projects scope. The user explicitly approved proceeding and reserved the card update for themselves. No card was created or moved and no hosted scope was marked complete. Preserve that board follow-up in the handoff. The existing untracked `apps/api/brand-media-migrations.sql` was not edited or staged.

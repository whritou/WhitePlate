# Real app and demo parity — 10 October 2026

The original pass targeted the real application. Its verification below is historical; the broader follow-up at the end supersedes its visual-parity claims. The follow-up also fixes shared demo/live customer previews. The supplied `whiteplate.zip` and existing `/demo` pages provide the visual reference; archive documents are reference content, not repository instructions. This follow-up is tracked on [issue #65](https://github.com/whritou/WhitePlate/issues/65).

## Comparison and changes

| Reference page | Real page / result |
| --- | --- |
| Backoffice appbar | Two rows, original navigation icons, compact typography, ink active state and lime hover. Context selection, locale flags, live-order link and sign-out remain real. Restaurant navigation includes Staff and source Settings when the account has authorized organization access. Kitchen users still see only Orders. |
| Dashboard | Source 1600px frame, contiguous four-metric strip, kitchen status colors, Connections panel, latest-order table and storefront column. Counts/totals use the loaded order page; payment status, pickup times and paid revenue are not invented. Uploaded catalog covers replace demo sample images. |
| Menu / Dishes | Full available width, 240px category sidebar, product cards with real covers and an adjacent 400px editor. Editor stacks at narrow container widths and text zoom. Existing filters, ordering, categories, extras, translations, stock, photos and archive/restore operations remain. Visited product drafts survive closing, category changes and tab switches. |
| Menu / Allergens | Localized reference list follows the source composition. Assignments are explicitly unconnected and never published as product facts. |
| Menu / Discount codes | Existing real discount editor moves into its own inline tab. |
| Menu / Languages | Existing language configuration, restaurant description and catalog translations move into the inline Languages tab; real supported locales remain authoritative. |
| Staff | Source Members, Invitations, Roles & permissions and Activity tabs. Existing roster, invitation/revocation and fixed API roles remain. Activity and custom permission examples stay disclosed; inviting uses the existing authorized operation in a dialog. |
| Settings | Restaurant navigation reaches the existing seven-section source settings shell with organization and restaurant context retained. Actual organization operations remain; unsupported billing/payments/domains/notification controls retain their disclosures. |
| Orders | Existing source lane/ticket composition retained. Real Cancelled lane, transition/version guards and recovery remain required contract differences. |
| History | Existing shared demo/real history composition retained, including filters, paging, snapshots and export. |
| Analytics | Existing source chart composition retained; fictitious reporting remains explicitly labeled pending real aggregates. |
| Studio | Existing source appearance editor/customer previews and actual brand-media editing retained. Theme publication remains a local draft, not a backend save. |
| Customer menu, checkout and tracking | Existing source customer shell and real cart/receipt/tracking adapters retained. Real catalog data and uploaded assets are authoritative. Unsupported service/payment fields remain disclosed. |

No new API schema, authorization permission or backend business feature is introduced. Real content and required error/loading/retry controls intentionally differ from sample data. This is composition parity, not a claim that every sample pixel or unsupported operation is available in production.

## Verification

Commands ran through the bundled Node 24.19 runtime using package-local CLI entry points equivalent to the npm scripts. Browser checks use development-only fixtures and mocked writes; they do not establish hosted email, payment, upload or SignalR acceptance. The unrelated untracked `apps/api/brand-media-migrations.sql` is preserved.

| Check | Actual result |
| --- | --- |
| `vitest run` | 70 files / 442 tests passed. Staff route test passed again after its final heading/summary alignment. |
| `tsc --noEmit` | Passed; final build also passed TypeScript. |
| `eslint .` | Exit 0, no errors; 19 existing recovered-source image warnings. Final changed files also passed targeted lint. |
| Targeted Prettier | Every changed/new TS/TSX file passed. Global `format:check` still fails on 142 untouched files; no unrelated rewrites. |
| `next build --webpack` | Final version passed, including corrected 320px cover requests; 91 generated pages. Inert process-only HTTPS auth/API origins used; environment files unchanged. Existing PostgreSQL SSL-mode notices remain. |
| Playwright live menu/workspace/photos/account suites | Initial combined run: 63/74 passed. The 11 failures were corrected or recovered in a 14/14 targeted run: tablet text zoom, manual keyboard tab activation, category dialog dismissal, two interrupted saves and the basket hydration timeout. Saved covers have a separate test checking a supported API size and nonzero image dimensions. |
| Playwright `live-demo-parity` | 4/4 passed: real uploaded-cover delivery, EN/FR four-tab adjacent editor and responsive containment, authorized Staff URL, lime appbar hover, dashboard sections. |
| Playwright orders/history/locale/responsive/demo sweep | 36/39 passed on development. One fixture navigation interruption passed on an isolated rerun. Two unchanged-demo failures (transient overflow and invalid development chunk) passed in the production run below. All orders/history/locale scenarios passed. |
| Playwright `lovable-migration` on production 3042 | 11/11 passed, including every demo page in EN/FR at 320/390/768/1440px, customer journey, local Studio drafts and navigation. Demo source was not changed. |
| `python docs/design-system/verify.py`, `git diff --check` | Passed: 119 canonical contrast pairs, token parity, documentation links and clean whitespace. |

Development cache writes initially hit Windows `EPERM` errors; restarting the local server with access to its generated cache resolved that limitation. Subsequent production checks avoid development/HMR artifacts. Screenshots of the actual live components were inspected at desktop and narrow widths. No pixel-diff baseline was supplied. Backend tests were not rerun because C# and API contracts are unchanged.

All requested compatible compositions are implemented locally. Hosted acceptance and deployment remain separate; keep #65 in review rather than treating local fixtures as hosted acceptance. Allergen assignment, staff activity/custom permissions, reporting, payment connections and theme publication remain explicit missing backend capabilities.


## Broad follow-up — 10 October 2026

The user reported remaining Menu, Staff action and sizing differences and requested a strict review of every corresponding back-office page. Reopened #65 in progress and reused the appropriate `fix/live-demo-design-parity` branch. The earlier claim of complete composition parity was too broad: rendered inspection found a separate Menu toolbar, open product rows, a fixed narrow editor, shrinking button/input overrides and an incorrectly green Staff invite action. The current demo implementation is the visual authority for this follow-up.

### Rendered comparison matrix

Paired desktop captures were taken for Menu, Staff, Dashboard, Orders, History, Analytics, Settings and Studio. The Orders comparison now renders the actual OrderDashboard within WorkspaceShell; the interaction harness also uses that shell. History also runs inside the actual live visual scope. Fixtures are development-only and remain unavailable in production. Measurements confirm ordinary titles are 36px/40px and Menu/Studio titles are 20px/28px in both surfaces. Account/restaurant entry and brand-media screens have no direct demo counterpart and retain the shared scoped recipes.

| Page | Follow-up result | Required real differences |
| --- | --- | --- |
| Shared shell and controls | Source button recipes, shadow/hover states, typography and minimum sizing; low-specificity generic rules allow compact appbar controls and source-owned fields to keep their actual recipes. | Real context, roles, status, sign-out and backend errors remain. |
| Menu: Dishes | Toolbar inside the catalogue column, 240px category sidebar, bordered image/name/price/availability cards, wide adjacent source editor, source tab typography and spacing; category creation stays in its sidebar. | Actual archived filters, manual persisted ordering and management controls remain. Sample allergens and arbitrary demo-only fields are not invented. |
| Menu: remaining tabs | Discount cards and primary action follow the source bordered inline recipe and content width. Allergens retain the shared reference; Languages keeps real configuration/translation operations with the same scoped controls. | Assignments/assisted translation/publication require separate backend work. |
| Staff | Ink uppercase Invite member with offset green shadow, square initials, bordered mono roles, underline tabs, email/role filter row and bordered invitation cards; direct computed-style equality test against demo passes. | API exposes emails rather than sample personal names/last-active timestamps. Revocation and authorized fixed roles remain. |
| Dashboard | Source heading line height, table header typography and cell spacing; existing source metric/connection/storefront composition verified. | Summaries describe loaded orders rather than claiming paid revenue. |
| Orders | Source ticket heading/customer hierarchy, total below items, full-width ink progress action, summary strip beside title and matching status colors. | Five real lanes, cancellation, version guards, accessible drag/keyboard alternatives and realtime state remain. |
| History | Preserve the current shared demo History recipe instead of letting live CSS square its rounded cards or shrink its native fields/table. | Real filters, paging, snapshots and page export remain. This scoped recipe exception is recorded in the design reference. |
| Analytics | Shared source charts/actions retained; generic live overrides no longer alter source fields/buttons. | Reporting disclosure remains until real aggregates exist. |
| Settings | Source title sizing and seven sections; actual lifecycle control moved into Danger zone instead of appearing in Organization profile and again in Danger. | Actual name save/archive/restore remain. Legal, payment, billing/domain/notification capabilities retain disclosures. |
| Studio | Shared source editor and controls; compact draft disclosure preserves useful preview space. Existing real brand-media tab retained. | Appearance remains a scoped local draft and brand uploads use actual storage. |

### Mobile preview regression

Checkout and tracking used viewport media queries: inside a 390px Studio preview on a desktop viewport they still selected two columns, shrinking the summary to about 132px and wrapping text character by character. The shared customer shell now establishes a named inline-size container. Both screens select two columns only when that container is at least 48rem; narrow previews stack form/status and summary with zero minimum widths. Customer padding also responds to container size. This fixes both demo and real appearance previews as well as actual customer pages.

Four EN/FR × demo/live browser tests failed first on summary width, then passed after the fix. They verify full-width summary, vertical ordering and horizontal containment for both checkout and tracking. Production demo variants also passed.

### Follow-up verification

Commands below run from `apps/frontend` through package-local Node CLI entry points, equivalent to npm scripts; npm itself is unavailable on this host.

| Command / check | Actual result |
| --- | --- |
| `node node_modules/vitest/vitest.mjs run` | Final 70 files / 442 tests passed. A stale Staff trigger assertion was updated from the old dialog-title aria label to the visible Invite member label; the dialog title itself remains unchanged. |
| `node node_modules/eslint/bin/eslint.js .` | Passed with 0 errors and 19 existing image warnings. Initial JSX spacing issues and task-only temporary scripts were corrected. |
| `node node_modules/typescript/bin/tsc --noEmit` | Passed; production build also passed TypeScript. |
| Targeted `prettier --check` | All changed/new TS/TSX/JSON files passed. Global check still reports 154 files, including previously unformatted source and existing compact stylesheets; no unrelated formatting sweep. |
| Development Playwright: live-demo-parity/live-workspace/menu-builder/orders-kanban/order-history | Initial 41/45 passed with 4 outdated desktop 48px assertions. Tablet requirements remain 48px; desktop now follows 44px demo sizing. Second run 42/45 passed; all 3 failures recovered in a 3/3 run: HMR navigation timeout, fixture hydration readiness and touch coordinates outside the viewport after adding the actual appbar. The touch test now keeps both stacked lane targets on screen. |
| Final `live-demo-parity` | 9/9 passed: EN/FR mobile previews, actual cover, adjacent editor/responsive containment, authorized navigation/hover and exact Staff action recipe plus roster filtering. |
| Production `lovable-migration` on localhost:3046 | 11/11 passed, including every demo route at 320/390/768/1440px in EN/FR, locale/customer journeys, draft storage and dialogs. |
| Production mobile Studio tests | 2/2 passed (EN/FR demo); development verifies both live variants. |
| `next build --webpack` | Passed, 91 generated pages; inert process-only HTTPS auth/API origins used. Existing PostgreSQL SSL-mode notices remain. |
| Root `py docs/design-system/verify.py` and `git diff --check` | Passed: 119 contrast pairs, runtime/token alignment, documentation links and whitespace. |

The current comparison uses rendered fixtures and reference recipes, not a pixel-diff claim for differing restaurant data or disclosure text. No API/C# contract changes; backend tests were not rerun. Preserve the unrelated untracked `apps/api/brand-media-migrations.sql`. Deployment and authenticated hosted acceptance remain pending; keep #65 in review after the branch push. Backend-only roadmap items remain unconnected, as before.

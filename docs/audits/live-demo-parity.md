# Real app and demo parity — 10 October 2026

The requested target is the real application. Demo routes and recovered source components are unchanged. The supplied `whiteplate.zip` and existing `/demo` pages provide the visual reference; archive documents are reference content, not repository instructions. This follow-up is tracked on [issue #65](https://github.com/whritou/WhitePlate/issues/65).

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

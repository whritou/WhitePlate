# M2 menu product metadata

Updated 11 October 2026. Metadata behavior is implemented in the real Menu Builder source. The additive database migration and shared-environment/hosted acceptance remain outstanding; see [decision 0009](../architecture/decisions/0009-menu-product-metadata.md), the [API contract](../api/api-contracts.md) and [database schema](../database/database-schema.md).

## Menu editor behavior

- Product forms expose an optional SKU/reference, **Contains** and **May contain** allergen declarations, dietary declarations, preparation guidance minutes and localized preparation notes. The SKU is an ordinary editable text input that fills the metadata column; its label no longer caps the width. API validation and normalization remain authoritative.
- Each allergen declaration is a localized click-to-toggle popover with 14 controlled EU allergen checkboxes, a selected count and a clear action. Selected values submit under the existing field names. Dietary declarations remain separate checkboxes. The dedicated Allergens tab has been removed from the menu workspace.
- The product list and editor retain readable titles and descriptions at narrow widths. The shared Lovable workspace and menu scope now use `overflow-wrap: break-word` instead of `anywhere`; the product text flex child grows within its column. Previously, `anywhere` reduced its min-content width to zero while the child had `min-width: 0` and no flex growth, so squeezed layouts could render text one character per line.
- The unselected-product prompt no longer reserves `60vh`. At desktop widths, the category sidebar and product list fit the available menu viewport; the list scrolls independently, keeping **New category** and **Manage categories** together at the bottom of the category column. At narrower viewport widths, both actions stay in one fixed bottom row. The menu workspace no longer creates a container-query containing block for those viewport-fixed actions.
- On narrow screens, the selected product panel follows the document scroll rather than trapping the page in a nested scroll region. Product editing keeps **Cancel** and **Save** sticky above the category action row. Preparation guidance and note inputs share the same label height so their controls align on desktop.
- Product photography uses the available editor width: the preview/gallery sit to the left, and framing, image details, guidance and photo actions sit to the right on desktop. The two areas stack on narrow screens.
- The category archive confirmation uses explicit responsive viewport sizing in the shared alert dialog. Keep spaces encoded in Tailwind `calc()` utilities so the popup does not collapse to its intrinsic content width.

## Verification

The development-only `/en/catalog-design-test` and `/en/photo-design-test` fixtures render the actual `MenuBuilderWorkspace`, product form and photo editor with sample catalog data. They do not prove authenticated API, database migration, storage-provider or hosted acceptance.

On 11 October 2026, from `apps/frontend`:

- `node node_modules/playwright/cli.js test tests/browser/menu-workspace-usability.spec.ts --project=menu-builder` passed all five focused regressions against the actual local menu page. They typed SKUs at 1440, 1024 and 390 pixels; checked title/description wrapping; scrolled the editor and category list; selected multiple values in both allergen lists; confirmed the allergen tab is absent; and measured desktop/mobile photo control placement.
- `node node_modules/vitest/vitest.mjs run --configLoader runner` passed 70 files and 444 tests.
- `node node_modules/typescript/bin/tsc --noEmit` passed.
- `node node_modules/eslint/bin/eslint.js .` passed with no errors. It reported 19 existing `@next/next/no-img-element` warnings in other components.
- Prettier check of every changed TypeScript, TSX, CSS module, JSON and test file passed.
- `py -3 docs/design-system/verify.py` passed contrast, token/palette parity and documentation-link scans.
- `node node_modules/next/dist/bin/next build --webpack` passed after supplying temporary HTTPS values for `BETTER_AUTH_URL` and `API_BASE_URL`, because the local `.env` uses HTTP and production build configuration rejects it. Webpack emitted non-fatal cache-write `EPERM` warnings for ignored `.next` files; compilation, type-checking, page generation and final route tracing completed successfully.
- Follow-up browser verification confirmed the SKU fills its metadata column, the allergen options are operable by role-labelled checkbox clicks without modifier keys, Cancel/Save stay above the viewport-fixed category actions at tablet and phone widths, preparation inputs align, and mobile page scrolling chains through the selected product without a blank tail below it. The latest checks used `--output` under the system temporary directory because Playwright could not remove an older workspace `test-results` directory under the local filesystem permissions.
- A follow-up regression opened the category archive confirmation on the actual menu fixture and verified a 512px dialog at 1440px viewport width and a 358px dialog at 390px viewport width; all six menu usability browser checks passed.

The app was exercised through the local browser fixtures, not against a hosted restaurant or the shared database. No migration, API contract or schema change was made for this UI follow-up.

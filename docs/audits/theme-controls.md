# T2 theme controls — 15 October 2026

The existing Lovable Studio now uses authorized, versioned restaurant theme drafts. Suggestions use the saved T1 logo; manual colors, existing presets, ambiance presets, radius and locally bundled fonts remain editable. Existing editor classes/styles and shared admin tokens are retained. See [decision 0012](../architecture/decisions/0012-tenant-theme-drafts.md) for validation, defaults, contrast and scope.

Demo storage remains browser-only. Appearance writes exclude identity/contact/domain/media fields. T1 editing remains in Brand media. Preview menu/order data are samples, disclosed in the existing notice area. T3 publication, public consumption and combined brand publication remain separate.

## Verification

Commands use bundled Node 24 and package-local tools because the configured npm shim is unreliable. Initial sandbox runs could not read NuGet configuration or write Vitest's generated config; checks were rerun with permitted host access. API tests first failed with 404; parser tests first failed on appearance isolation and contrast; the initial browser test lacked the server-save action.

| Check | Result |
| --- | --- |
| `dotnet test apps/api/WhitePlate.slnx --no-restore` | 278 passed. SQLite fixtures cover real persistence, versions and owner/manager/foreign/Kitchen/anonymous boundaries; extraction tests cover neutral/transparent/invalid logos and deterministic color sampling. |
| Frontend `vitest run` | 94 files, 580 tests passed: appearance allowlisting, contrast, BFF origin/selector/body bounds and safe failures. |
| Frontend `eslint .` | Passed: 0 errors, 19 existing source-image warnings. |
| Frontend `tsc --noEmit` | Passed. |
| Global `prettier --check "**/*.{ts,tsx}"` | Failed on 501 existing files before final browser-test formatting. Task files receive a targeted check; no unrelated rewrite. |
| `next build --webpack` | Passed: compilation, TypeScript and 99 static pages. Process-only inert HTTPS auth/API origins; existing pg SSL-mode warnings. No deployment or environment-file edit. |
| Playwright `theme-studio` | 4 passed: server save/read-back after reload, stale-save preservation/explicit reload, EN/FR at 320/390/768/1440px, saved-logo preset, transport failure and denied-read hiding. Transport is intercepted; this is UI evidence. |

Additional checks:

- The final API suite passed 278 tests after storage-read failure coverage; the 11 brand/theme HTTP cases passed again after adding foreign-tenant read-back, unknown-URL rejection and revoked-manager assertions.
- `dotnet ef migrations has-pending-model-changes --project apps/api/WhitePlate.Infrastructure --startup-project apps/api/WhitePlate.Api` passed: no model changes since the generated migration. An inert local design-time connection was used; no database migration was applied.
- All new/changed TS/TSX files pass targeted ESLint and Prettier; final TypeScript check passed. The design-system validator passed 119 contrast pairs, token parity and its documentation-link scan; `git diff --check` passed.
- The broad demo run on the existing development server initially passed 12/15 (all four theme cases passed). EN/FR reflow and all-route navigation failed with `net::ERR_ABORTED`. A later development rerun hit a loading timeout in the French Studio and EN reflow. The isolated French Studio rerun subsequently passed at all four widths. These dev results are not silently waived: the same existing demo suite passed **11/11 on the local production build at port 3045**, including both reflow cases and route navigation. An initially anchored isolated-test grep matched no tests; the corrected selector ran and passed.
- Desktop 1440px and mobile 390px Studio captures were inspected. Existing two-column/stacked editor, source typography, preset-card style and preview are retained. No stylesheet or canonical token changed. Captures are generated local test artifacts, not proof of a supplied pixel-diff baseline.

## Rollout and remaining acceptance

Migration generated, not applied. Deploy migration/API before frontend. Verify real PostgreSQL conditional writes, cross-account/two-tenant isolation, manager revocation, actual media-provider failure and saved-logo replacement/removal from another session/device. Browser tests intercept theme transport; API tests independently use the actual handler/repository with SQLite and test storage.

Actual contrast is reported; drafts below thresholds are allowed. T3 must enforce safe publication and assess every real storefront/checkout/tracking state. Radius retains reference sliders and fonts remain bundled. Real T1 uploads use the existing Brand media tab; demo-only inner Brand & details controls are disabled in connected Studio.

The user explicitly waived project-board updates after GitHub CLI reported missing `read:project` scope.

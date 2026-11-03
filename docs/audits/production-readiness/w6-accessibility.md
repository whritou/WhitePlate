# W6 — Accessibility (WCAG 2.2 AA)

## Scope and method

Audit date 2026-10-25. Audited code is `origin/main` `55f31a5`; this file was written on the audit branch at `849e3cd`, which changes only documentation. Target: WCAG 2.2 level A and AA. No product code, test or dependency was changed; every probe script lived in the session scratchpad, outside the repository, and raw output stays there.

Read first: `docs/design-system/README.md` (accessibility, localization and state rules, lines 112-118), `docs/audits/ui-state-density.md`, `docs/development.md` ("Guest checkout browser fixture"), and the existing Playwright projects `design-system`, `orders-kanban`, `menu-builder`, `establishment-settings` and `mobile-workspace-settings`. Those projects test keyboard tab switching, Escape focus return and lane reflow (`apps/frontend/tests/browser/orders-kanban.spec.ts:240-290`, `design-system.spec.ts:122-179`), but none runs axe or checks that a focus indicator is visible.

Runtime. A clean copy of `apps/frontend` at `55f31a5` (outside the repository, with its own `node_modules`) ran `next dev --webpack` on `127.0.0.1:3016` with Node 24.19.0 called by its full path. Process-only settings: `STOREFRONT_BASE_DOMAIN=localhost`, `PUBLIC_TENANT_API_URL_TEMPLATE=http://{tenant}.localhost:5189`, `NODE_OPTIONS=--require ./tests/fixtures/localhost-dns.cjs`, `BETTER_AUTH_URL=http://localhost:3016`, and loopback `DATABASE_URL` and `API_BASE_URL` values on port 1, which nothing listens on. The deterministic guest fixture `tests/fixtures/checkout-api.mjs` ran on `127.0.0.1:5189`. No database, real API or hosted service was contacted. Both processes were stopped afterwards, and ports 3016 and 5189 were confirmed closed. Screenshots were taken of fixture data only and kept in the scratchpad.

Pages tested: landing `/{l}`; `sign-in`, `sign-up`, `forgot-password`, `reset-password`; `demo` and the 10 `demo/*` pages (`menu`, `checkout`, `tracking`, `orders`, `dashboard`, `history`, `settings`, `staff`, `studio`, `analytics`); the dev fixture routes `orders-kanban-test`, `catalog-design-test?view=builder` (with and without `shell=1`), `establishment-design-test`, `studio-parity-test`, `order-history-test` and `live-workspace-test`; and the fixture storefront `http://bistro.localhost:3016/{l}`, including its `?step=checkout` page.

Probes:

1. **axe sweep.** Playwright (`@playwright/test` from the clean copy, installed Chrome via `channel: "chrome"`, headless) injected the transitive `axe-core` 4.13.0 (`node_modules/axe-core/axe.min.js`) with `page.addScriptTag`. `axe.run` used tags `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa`. The sweep covered 24 page templates × `en`/`fr` × `colorScheme` light/dark × 320 and 1280 px, which is 192 runs: 192 returned HTTP 200, and 0 probe errors occurred. That count is about the probe; it does not mean zero violations. The fixture storefront's `?step=checkout` page was tested by keyboard and accessibility tree but was not part of the axe sweep, which is why axe's `link-name` rule did not report A11Y-10. Results by rule:

   | Rule | Runs | Nodes | Pages | Outcome after manual verification |
   | --- | --- | --- | --- | --- |
   | `document-title` | 176 | 176 | 22 of 24 templates (all but landing and storefront; 176 runs ÷ 8 combinations) | A11Y-01 |
   | `color-contrast` | 60 | 309 | storefront, `reset-password`, landing, `demo`, `demo/history`, `demo/orders`, `demo/staff`, `demo/studio` | A11Y-03, A11Y-04, A11Y-13 |
   | `label` | 8 | 8 | `demo/menu` | A11Y-13 |
   | `svg-img-alt` | 8 | 24 | `demo/analytics` | A11Y-12 |
   | `scrollable-region-focusable` | 2 | 2 | `fr/demo/analytics` at 320 px | A11Y-12 |
   | needs review: `aria-prohibited-attr` | 24 | 88 | landing (8 runs × 3), kanban (8 × 7), establishment (8 × 1) | A11Y-17 |
   | needs review: `color-contrast` | 60 | 1,004 | landing and demo pages only | Triaged under Not covered |

   The `aria-prohibited-attr` nodes were inspected in a later re-run (same build, `en`, 1280 px). All are `aria-label` on an element with no role, which assistive technology ignores:
   - kanban: the lane-count and timer badges (A11Y-17);
   - landing: three `div`s in the marketing theme preview (`components/marketing/landing/previews/product-theme-preview.tsx:33`, `:66`, `:91`: "Store theme presets", "Customer preview pages", "Themed customer experience");
   - establishment: the "Opening hours" `div` in the saved collection information (`components/storefront/collection-information.tsx:160`), which already has a visible `h4` with the same text.

   The landing and establishment nodes lose only a redundant label, so they are recorded as part of the A11Y-17 hygiene pattern rather than as separate findings.

   Light and dark results were identical. The runtime forces the light theme (`apps/frontend/app/[locale]/layout.tsx:31` sets `class="light"`; dark mode was removed by owner decision, per `docs/design-system/README.md:7`), so dark is recorded as not applicable rather than as a pass. `html[lang]` matched the URL locale in 192 of 192 runs, and no run had horizontal page scroll.
2. **Keyboard journeys and accessibility tree** (Playwright keyboard only, `locator.ariaSnapshot()`, focused-element inspection of `outline` and `box-shadow`):
   - (a) Guest on the fixture storefront: menu, options dialog, add to basket, basket sheet, discount entry, checkout page.
   - (b) Kitchen on `/{l}/orders-kanban-test`: moving an order Pending → Preparing → Ready → Completed by keyboard.
   - (c) Owner: menu builder (tabs, category and product reorder, New category dialog, category actions menu, product editor); establishment settings; sign-in, sign-up, forgot-password and reset-password, including a submit that fails against the unreachable placeholder database. The test values were generated for this audit (`w6-audit@example.invalid`), and no real credential was used.
3. **Focus indicators**: before/after screenshots for tab triggers, menu items and kanban cards.
4. **Contrast**: every axe contrast node was recomputed in the page from computed colours, and the storefront value also by hand.
5. **Resize**: text-only 200% (root `font-size: 200%`, which every rem size follows) and the browser-zoom equivalent (640 CSS px viewport at device scale factor 2) on 9 pages.
6. **Text spacing**: the WCAG 1.4.12 bookmarklet values injected on 5 pages.
7. **Focus obscured**: 2.4.11 on 5 pages at 320 × 640.
8. **Target size**: interactive elements under 24 × 24 px with the 24 px spacing-circle test.
9. **Language**: `lang` of page and parts after a storefront menu-language switch.

axe found only A11Y-01, 03, 04, 12, 13 and 17 (the last as "needs review"). A11Y-02, 05-11, 14-16, 18 and 19 come from manual, keyboard or accessibility-tree probes, which detect problems that axe does not.

No Blocker was found. Every core journey could be completed with the keyboard up to the point where the fixture stops: the guest checkout fixture has no quote or pickup-slot endpoint, so "Place order" stays disabled (see Not covered).

## Findings

### A11Y-01 — Most pages have no document title

- **Workstream:** W6
- **Location:** `apps/frontend/app/[locale]/layout.tsx:13-38` (no `metadata` or `generateMetadata`); titles exist only in `app/[locale]/page.tsx:10`, `app/[locale]/order/[orderId]/page.tsx:9` and the two `storefront-preview` pages
- **Evidence:** axe `document-title` failed in 176 of 192 runs on 22 of 24 templates, in both locales and at both widths. `page.title()` returned `""` on `sign-in`, `sign-up`, `forgot-password`, `reset-password`, every `demo/*` page and every workspace fixture. A search of `apps/frontend` (excluding `node_modules`) for `document.title` and `<title` finds no client-side title either. The storefront (`Bistro fixture`) and landing pages do have titles.
- **Impact:** WCAG 2.4.2 Page Titled (level A). Screen-reader users hear no page name on load or in the tab list, and browser tabs, history and bookmarks show only the URL. The auth pages and every organization workspace route (which inherit the same layout) are affected. Users can still complete the journeys, so this is not a Blocker.
- **Severity:** Should
- **Fix direction:** Add a localized `title` template to the `[locale]` layout metadata (for example `%s · WhitePlate`), and `generateMetadata` per route family (auth, workspace sections, demo) using the existing translation catalogs in both locales.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
For each of /en and /fr: sign-in, sign-up, forgot-password, reset-password, organization/*
Expected: document.title is non-empty, localized, and names the page
Actual:   document.title === "" (axe document-title, 176/192 runs)
```

### A11Y-02 — Tabs, tab panels and moved kanban cards show no keyboard focus indicator

- **Workstream:** W6
- **Location:** `apps/frontend/components/ui/tabs.tsx:34` (trigger) and `:47` (panel); `apps/frontend/components/orders/order-ticket.tsx:108`; `apps/frontend/components/orders/order-kanban.tsx:150`; menu items in `components/workspace/catalog/builder/menu-builder-category-actions.tsx:88`
- **Evidence:** These classes combine `outline-none` with `focus-visible:outline-2 focus-visible:outline-ring`, but leave out the `focus-visible:outline-solid` that `components/ui/button.tsx:6` has. In Tailwind v4, `outline-none` sets the outline style variable to `none`, so the focus outline keeps `outline-style: none`. In the page, the keyboard-focused "All orders" tab (`:focus-visible` true) computed `outline: none 2px oklch(0.5 0.16 152)` with no box-shadow, and screenshots with and without focus are pixel-identical. The "Dishes" tab and the `tabpanel` (which takes a Tab stop) behave the same in the menu builder. After a keyboard status move, the kanban moves focus to the order `article` (good), but that card computed `outline-style: none`, and the screenshot shows only its normal border. Menu items in the category actions menu signal focus only with `data-[highlighted]:bg-muted`, `rgb(239,244,255)` on a white popover, which is 1.10:1.
- **Impact:** WCAG 2.4.7 Focus Visible (AA), plus 1.4.11 Non-text Contrast for the menu highlight. Keyboard users lose track of focus on the order-status tabs (kitchen), the menu-builder and catalog tabs (owner) and the team directory tabs, and after every keyboard order move. The shared `Tabs` component spreads this to every screen that uses it (`order-status-tabs.tsx`, `menu-builder-workspace.tsx`, `catalog-workspace.tsx`, `team-directory-tabs.tsx`).
- **Severity:** Should
- **Fix direction:** Add `focus-visible:outline-solid` (or a `ring` box-shadow) to the four class strings above. Give highlighted menu items a visible outline, or a highlight with at least 3:1 against the popover. Extend `design-system.spec.ts` to assert a non-`none` outline on focused tabs.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
/en/orders-kanban-test: Tab to "All orders"; /en/catalog-design-test?view=builder: Tab to "Dishes";
press "Start preparing" with Enter
Expected: getComputedStyle(activeElement).outlineStyle !== "none" (or a visible ring) in each case
Actual:   outline-style "none" on the tab, the tabpanel and the focused order article
```

### A11Y-03 — Storefront secondary text in the default customer theme is below 4.5:1

- **Workstream:** W6
- **Location:** `apps/frontend/components/storefront/demo/storefront/model.tsx:57` (`muted = color-mix(in oklab, ${t.text} 60%, transparent)`); `apps/frontend/components/storefront/customer-restaurant-info.tsx:29`
- **Evidence:** axe `color-contrast` on `http://bistro.localhost:3016/{en,fr}` in every combination. Re-measured in the page: the product description "Seasonal vegetables" is `#6f7671` on `#f7f8f4` = 4.37:1 at 14 px/400 (also checked by hand from the theme text `#14201a` mixed 60% over `#f7f8f4`). The restaurant-info labels ("Adresse", "Horaires", "Téléphone", 12 px bold) measure 4.36:1 on the demo pages that share the renderer. One run also flagged the price `#1f7a4d` on the card's `#eaece8` tint at 4.47:1.
- **Impact:** WCAG 1.4.3 Contrast (Minimum) (AA) on the guest menu, the page every customer uses. The muted colour is derived from the owner-chosen text colour, so lighter custom themes are worse.
- **Severity:** Should
- **Fix direction:** Derive the muted text from the theme with a contrast floor (for example a mix of at least 70%, or compute it and clamp to 4.5:1 against the theme background). Add the derived customer roles to the token or contrast validator, which today checks only the global tokens (`docs/design-system/verify.py`, per `docs/audits/ui-state-density.md`).
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Storefront with the default "Verte" theme, /en and /fr, 320 and 1280 px
Expected: axe color-contrast passes for product descriptions, prices and info labels
Actual:   4.36-4.37:1 (descriptions, labels), 4.47:1 (price on tint)
```

### A11Y-04 — Error text in the Lovable-scoped surfaces fails contrast (auth alerts, checkout errors)

- **Workstream:** W6
- **Location:** `apps/frontend/components/theme/landing-demo.css:58` (`--destructive: oklch(0.577 0.245 27.325)`, which overrides the global `#B91C1C` from `app/globals.css:43`); used by `components/ui/alert.tsx:11` and `components/ui/badge.tsx:13` (`bg-destructive-muted text-destructive`) and by `text-destructive` in `components/storefront/live-checkout.tsx:171`
- **Evidence:** In the page, the `reset-password` alert "This reset link is invalid or expired…" is `#e7000b` on `#fee2e2` = 3.90:1 at 16 px (axe, all 8 combinations). The sign-in failure alert ("We couldn't complete that request…", reproduced by a submit that failed against the unreachable placeholder database) uses the same component. The checkout quote error "Your total could not be calculated. Please try again." is `#e7000b` on `#f7f8f4` = 4.47:1 at 14 px. The destructive badge on `demo/history` measures 3.9:1. With the global token `#B91C1C`, the same pairs pass. The scoped override is what breaks them.
- **Impact:** WCAG 1.4.3 (AA). Error messages, the content users most need to read, fall below the minimum on sign-in, password reset and guest checkout. The same scoped override reaches the organization workspace, whose shell root uses `lovable-surface` (`components/workspace/shared/workspace-shell.tsx:94`). Destructive alerts and badges there inherit the same red. This was not measured on live workspace pages, which need the API.
- **Severity:** Should
- **Fix direction:** Set the scoped `--destructive` to a value that reaches 4.5:1 on both `--destructive-muted` and the customer and auth backgrounds (the global `#B91C1C` does), and add the scoped surfaces to the contrast validator.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
/en/reset-password (no token); /en/sign-in failed submit; storefront checkout with a quote error
Expected: alert and error text contrast >= 4.5:1
Actual:   3.90:1 (alert on tint), 4.47:1 (error text on page background)
```

### A11Y-05 — Auth links inside sentences are distinguished by colour only

- **Workstream:** W6
- **Location:** `apps/frontend/components/auth/auth-form.tsx:196-201` (`font-medium text-brand-text underline-offset-4 hover:underline`)
- **Evidence:** "New to WhitePlate? **Create account**" (sign-in) and "Already have an account? **Sign in**" (sign-up). The link is `oklch(0.5 0.16 152)` and the sentence text `oklch(0.45 0.02 158)`: 1.36:1 between them, no underline at rest or on keyboard focus (`text-decoration-line: none` while focused), and only a 500 versus 400 weight difference. Verified by screenshot.
- **Impact:** WCAG 1.4.1 Use of Color (A; failure F73). Users who cannot tell green from grey do not see the link to create an account or to switch to sign-in. A user who knows the link is there can still reach it, so this is not a Blocker.
- **Severity:** Should
- **Fix direction:** Underline these inline links at rest (or keep 3:1 against the surrounding text and underline on hover and focus).
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
/en/sign-in and /en/sign-up, link inside "New to WhitePlate?" / "Already have an account?"
Expected: text-decoration-line includes "underline", or link/text contrast >= 3:1 with a non-colour cue
Actual:   no underline, 1.36:1 against the sentence text
```

### A11Y-06 — Menu content in another language is not marked with `lang`

- **Workstream:** W6
- **Location:** `apps/frontend/components/storefront/live-storefront.tsx:100` (the menu locale is passed as data, `lang: menu.locale`, but no element gets a `lang` attribute); `apps/frontend/components/storefront/demo/storefront/view.tsx`; the menu builder renders FR catalog names inside `lang="en"` workspace pages
- **Evidence:** On `http://bistro.localhost:3016/en`, choosing FR in "Menu language" navigated to `?menuLocale=fr`. Afterwards the menu showed "Menu du jour", "Soupe" and "Légumes de saison", while the only `[lang]` element in the document was `<html lang="en">`. The same applies the other way round, when a restaurant's default menu locale differs from the UI locale. Kanban tickets already do this correctly (`components/orders/order-ticket.tsx:112`, `lang={order.menuLocale}`).
- **Impact:** WCAG 3.1.2 Language of Parts (AA). Screen readers read French dish names and descriptions with English pronunciation rules (and the reverse), which makes the menu hard to follow for a guest choosing a dish.
- **Severity:** Should
- **Fix direction:** Put `lang={menu.locale}` on the storefront menu, product dialog, basket and receipt containers whenever it differs from the UI locale, and `lang` on catalog names in the menu builder (the locale being edited).
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
GET bistro.localhost/en?menuLocale=fr
Expected: the menu container (or each category/product) has lang="fr"
Actual:   only <html lang="en"> in the document
```

### A11Y-07 — Menu-builder reordering has no single-pointer alternative, and its keyboard method is undocumented

- **Workstream:** W6
- **Location:** `apps/frontend/components/workspace/catalog/builder/menu-builder-product-list.tsx:138-159` and `menu-builder-category-list.tsx:75`, `:105-120` (drag handles; ArrowUp/ArrowDown only); `use-menu-builder-ordering.ts:123-170`; help text `messages/en.json:1467` ("Drag products to reorder them. Drop a product on a category to move it.")
- **Evidence:** In the builder fixture, the "Move product Soupe du potager" handle (32 × 32) does nothing on click, Enter or Space. Reordering by pointer needs a drag. A keyboard path exists (ArrowUp/ArrowDown on the focused handle), but the handle has no `aria-describedby`, and neither the visible help text nor the accessible name mentions it. Moving a product to another category has a non-drag path (the "Category" select in the product editor), but reordering within a category does not. The kitchen kanban passes the same criterion: each card has a "Start preparing — order …" or "Mark ready — order …" button, and pressing them moved an order to Completed.
- **Impact:** WCAG 2.5.7 Dragging Movements (AA). Owners who cannot drag (tremor, switch or touch-only use) cannot set the display order of dishes or categories, and keyboard users are not told the arrow keys exist.
- **Severity:** Should
- **Fix direction:** Add "Move up" and "Move down" buttons (or a position field), reachable by click and tap, next to each handle. Describe the arrow-key behaviour through `aria-describedby` and the visible help text in both catalogs.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
/en/catalog-design-test?view=builder, product "Soupe du potager" in "Les entrées"
Expected: a click-only control moves it below "Salade…"; handle exposes arrow-key instructions
Actual:   only drag (pointer) or undocumented ArrowUp/ArrowDown
```

### A11Y-08 — Focus is lost to the page after common actions

- **Workstream:** W6
- **Location:** `apps/frontend/components/storefront/demo/storefront/view.tsx:225-228` (`onAdd` closes the product dialog by unmounting it; `components/ui/lovable-modal.tsx:21-39` sets no `finalFocus`); `apps/frontend/components/auth/auth-form.tsx:170` (`disabled={pending}` on the focused submit); `menu-builder-product-list.tsx:142` (`disabled={pending}` on the focused handle)
- **Evidence:** Keyboard runs: (1) on the storefront, "Add Soup", Enter, Tab to "Add 1 · €11.00", Enter. The dialog closes and `document.activeElement` is `body` (closing with Escape correctly returns focus to "Add Soup"). (2) On sign-in, Enter on "Log in" with test values: the request fails (500 from the unreachable database), the error alert appears, and focus stays on `body` for at least 15 s. (3) In the menu builder, ArrowDown on a product handle: focus goes to `body` while the write is pending. Each time, the next Tab starts again from the top of the page.
- **Impact:** WCAG 2.4.3 Focus Order (A). Keyboard and screen-reader users lose their place after adding a dish, after a failed sign-in and after each reorder step, and must tab back through the header. The journeys can still be completed, so this is not a Blocker.
- **Severity:** Should
- **Fix direction:** Return focus to the trigger (or to the basket button) when the product dialog closes after adding. Keep pending submit buttons focusable (`aria-disabled` instead of `disabled`) or move focus to the error alert. Restore focus to the moved handle after a reorder settles.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Storefront: Enter "Add Soup" -> Enter "Add 1"; sign-in: Enter "Log in" with failing credentials;
builder: ArrowDown on a product handle
Expected: activeElement is the trigger / basket button, the alert or submit, and the moved handle
Actual:   activeElement is <body> in all three
```

### A11Y-09 — Adding a dish to the basket is not announced

- **Workstream:** W6
- **Location:** `apps/frontend/components/storefront/demo/storefront/view.tsx:225-228`; the basket button label `components/storefront/live-storefront.tsx:233`
- **Evidence:** A `MutationObserver` on every `[role=status]`, `[role=alert]` and `[aria-live]` (except `off`) recorded nothing new after a dish was added. Only the basket button's own text changed ("Basket · 0" to "Basket · 1"), and focus was on `body` (A11Y-08), so nothing is read to the user.
- **Impact:** WCAG 4.1.3 Status Messages (AA). Screen-reader guests get no confirmation that the dish went into the basket (the classic "item added" status message), so they may add it twice or give up.
- **Severity:** Should
- **Fix direction:** Announce "Soup added, basket 1 item" through a polite live region (the existing workspace notification region or a storefront `role="status"`), in both locales.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Storefront: add Soup with the keyboard
Expected: a role=status (or aria-live=polite) node receives "… added to basket" text
Actual:   no live-region text change
```

### A11Y-10 — Customer page footer renders an empty phone link when the restaurant has no phone

- **Workstream:** W6
- **Location:** `apps/frontend/components/storefront/demo/shared/customer-shell.tsx:86-93` (unconditional `<a href="tel:…">` with only an icon and `{t.phone}`); `components/storefront/restaurant-menu.tsx:75` and `lib/lovable/storeTheme.ts:65` (`phone` defaults to `""`)
- **Evidence:** On the fixture checkout page (`?step=checkout`, no establishment data), the accessibility tree shows `contentinfo > link` with no name and `href="tel:"`, a 16 × 16 icon-only link that is a Tab stop. The tracking page guards the same link with `{t.phone && …}` (`demo/tracking/customer-tracking.tsx:317`). The shell does not. Phone is optional in establishment settings ("Contact phone" carries no required marker, unlike "Trade name *").
- **Impact:** WCAG 2.4.4 Link Purpose and 4.1.2 Name, Role, Value (A). Screen-reader users hear "link" with no name on checkout, for every restaurant without a phone number and whenever establishment data fails to load. Activating it opens an empty dialler.
- **Severity:** Should
- **Fix direction:** Render the footer phone link only when a phone exists (as tracking does), and give it a name such as "Call {restaurant}".
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Storefront checkout for a restaurant without a phone
Expected: no tel: link, or a link with an accessible name
Actual:   <a href="tel:"> with an empty accessible name
```

### A11Y-11 — Menu-builder category names and editor are clipped under text spacing and text-only enlargement

- **Workstream:** W6
- **Location:** `apps/frontend/components/workspace/catalog/builder/menu-builder-category-list.tsx:133` (`truncate`, no `title`); `apps/frontend/components/theme/workspace-visuals.css:173` (rem-based three-column grid inside an `overflow: clip` layout)
- **Evidence:** With the 1.4.12 spacing values injected, the category rail shows "Les ent…", "Ancienn…", "Les des…" and the "Show" select "Active produ…", with no title or other way to read the full names. With text-only 200% (root font size doubled, 1280 px window), `.live-menu-layout` has `scrollWidth` 1984 against `clientWidth` 1280 under `overflow: clip`, so the product editor ("Select a dish…") is cut at the viewport edge with no scroll. Browser zoom to 200% (640 CSS px) reflows correctly, so 1.4.4 itself passes.
- **Impact:** WCAG 1.4.12 Text Spacing (AA): category names are lost to users who override spacing for dyslexia or low vision. Users who enlarge text only (browser or OS font-size setting) lose the right-hand editor panel.
- **Severity:** Should
- **Fix direction:** Let category rows wrap (or expose the full name through a visible tooltip or `title`, plus the accessible name). Base the three-column breakpoint on available width in `em`, or a container query, so enlarged text falls back to the stacked layout instead of being clipped.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
/en/catalog-design-test?view=builder&shell=1 with WCAG 1.4.12 spacing; and with html{font-size:200%}
Expected: full category names visible; no clipped content
Actual:   names truncated with ellipsis; layout scrollWidth 1984 > 1280 under overflow: clip
```

### A11Y-12 — Analytics view: unnamed chart images and a table scroller unreachable by keyboard

- **Workstream:** W6
- **Location:** `apps/frontend/components/workspace/analytics/page/sections/section-01.tsx:130-143` (Recharts `Pie` sectors exposed as `role="img"` without a name; the `Cell` children are wrapped in `<Copy>`) and `:196` (`overflow-x-auto` around the best-sellers table with no focusable content); the live route uses the same view (`components/workspace/analytics/analytics-workspace-client.tsx` imports `AnalyticsPageView`)
- **Evidence:** On `/{l}/demo/analytics`, axe `svg-img-alt` reported 3 nodes in every run: `path.recharts-sector[name="Web"|"QR code"|"Phone"]`, each with `fill="#808080"`, so the per-channel colours are not applied either. `scrollable-region-focusable` reported the table scroller at 320 px in FR, where the longer labels overflow. The channel values are also listed as text below the chart, so the data itself is available.
- **Impact:** WCAG 2.1.1 Keyboard (A): at narrow widths, keyboard users cannot scroll the best-sellers table horizontally. WCAG 1.1.1 (A): screen readers announce three unnamed images. The grey sectors no longer match the coloured legend swatches. The live analytics page was not run (it needs the API); the source is shared.
- **Severity:** Should
- **Fix direction:** Mark the pie `aria-hidden` (its data is in the adjacent list) or name each sector. Move the `Cell`s out of the `<Copy>` wrapper so colours apply. Give the scroller `tabIndex={0}`, `role="region"` and an accessible name.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
/fr/demo/analytics at 320 px; live /fr/organization/analytics with data
Expected: axe svg-img-alt and scrollable-region-focusable pass; table scrollable by keyboard
Actual:   3 unnamed role=img sectors; overflow-x-auto region not focusable
```

### A11Y-13 — Landing and demo pages: low-contrast text and an unlabeled demo field

- **Workstream:** W6
- **Location:** `apps/frontend/components/marketing/landing/sections/section-10.tsx:15` (`text-primary-foreground/85`); `components/demo/workspace/orders/page.tsx:252`, `components/demo/workspace/team/sections/section-08.tsx:20` and `components/demo/workspace/menu/sections/section-16.tsx:89` (`opacity-60` rows); the demo menu category name input
- **Evidence:** Re-measured in the page: the landing call-to-action note "Explore the product today…" is `#d4e6db` on `#007b2f` = 4.17:1 at 14 px. `demo/orders` collected tickets have text at 2.58-4.28:1 (`opacity-60`). The `demo/staff` suspended row has text at 2.54-3.02:1, including the "suspended" status and an action button. `demo/studio` repeats A11Y-03. On `demo/menu`, axe `label` flags the category-name input (value "Starters"), which has no label, `aria-label` or `aria-labelledby`.
- **Impact:** WCAG 1.4.3 (AA) on the public landing page and the public demo, and 4.1.2 / 3.3.2 (A) for the demo field. These are marketing and illustration pages, not product journeys, so they are lower priority than A11Y-03 and A11Y-04. Dimming rows with opacity is not covered by the inactive-component exception, because the rows are still readable content and controls.
- **Severity:** Should
- **Fix direction:** Use full-opacity `primary-foreground` on the landing call-to-action. Express inactive or collected rows with a status label and muted tokens that keep 4.5:1, instead of `opacity-60`. Label the demo category-name input.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
axe wcag2aa on /{en,fr}, /{l}/demo, /{l}/demo/orders, /{l}/demo/staff, /{l}/demo/menu
Expected: no color-contrast or label violations
Actual:   4.17:1 landing note; 2.54-4.28:1 dimmed demo rows; unlabeled demo input
```

### A11Y-14 — Basket and product-dialog quantity buttons are named only "−" and "+"

- **Workstream:** W6
- **Location:** `apps/frontend/components/storefront/demo/storefront/section-9.tsx:117-136` (basket sheet); `components/storefront/demo/storefront/shared.tsx:296` and `:308` (product dialog); compare `components/storefront/demo/checkout/section-3.tsx:81` (`aria-label="Remove one {product}"`)
- **Evidence:** Accessibility tree of the basket sheet: `listitem: Soup, Sourdough, €11.00, button "−", "1", button "+"`. The product dialog shows the same. On the checkout page, the same function is named "Remove one Soup" and "Add one Soup". The option group "Bread · Required · pick 1" is a paragraph, not a group label for its toggle buttons.
- **Impact:** WCAG 3.2.4 Consistent Identification (AA): the same decrement and increment function has different names on consecutive guest steps. WCAG 2.4.6: with several basket lines, "minus" and "plus" do not say which dish they change. Screen-reader guests can change the wrong line.
- **Severity:** Should
- **Fix direction:** Reuse the checkout labels ("Remove one {product}" / "Add one {product}") in the basket sheet and the dialog. Wrap each option set in a `role="group"` labelled by its title and rule.
- **Regression test:** Sketch below
- **Status:** Confirmed

```text
Storefront basket with Soup and Tart
Expected: buttons "Remove one Soup", "Add one Soup", "Remove one Tart", ...
Actual:   buttons "−" and "+" on every line
```

### A11Y-15 — Storefront menu-language select re-renders the menu as soon as a new value is chosen

- **Workstream:** W6
- **Location:** storefront "Menu language" select (`apps/frontend/components/storefront/live-storefront.tsx:192-212`, `router.replace` in `onChange`; the checkout header has the same pattern in `components/storefront/live-store-actions.tsx:33-38`)
- **Evidence:** On the storefront, pressing ArrowDown once on the focused, closed "Menu language" select changed the value and navigated to `?menuLocale=fr`, which re-rendered the whole menu in French.
- **Impact:** Borderline for WCAG 3.2.2 On Input (A). The guest stays on the same page and the same menu, now in another language. That is arguably a change of content rather than of context, so it is recorded as hygiene. Keyboard users browsing the options with the arrow keys still trigger reloads they did not intend.
- **Severity:** Could
- **Fix direction:** Apply the change on an explicit confirmation (a button, or a menu-button pattern instead of a native select), or announce the behaviour in the label.
- **Regression test:** None
- **Status:** Confirmed

### A11Y-16 — "Back to WhitePlate" is a link exposed as a button

- **Workstream:** W6
- **Location:** `apps/frontend/components/auth/auth-frame.tsx:27-36` (`Button` with `render={<Link href="/" />}` and `nativeButton={false}`)
- **Evidence:** On all four auth pages, the accessibility tree has `button "Back to WhitePlate"` on an `<a href="/en">` with `role="button"`.
- **Impact:** WCAG 4.1.2 role accuracy (hygiene). Screen-reader users expect a button to act in place, but this one navigates. It still works with Enter.
- **Severity:** Could
- **Fix direction:** Render a styled link (keep the `a` semantics without `role="button"`).
- **Regression test:** None
- **Status:** Confirmed

### A11Y-17 — `aria-label` on badge spans is ignored, so kanban counts and timers lose context

- **Workstream:** W6
- **Location:** `apps/frontend/components/orders/order-kanban.tsx:187-192` (lane count `Badge` with `aria-label` "{count} loaded orders"); `apps/frontend/components/orders/order-ticket.tsx:177-198` (elapsed and pickup timer `Badge`s with `aria-label`); `components/ui/badge.tsx` renders a `span` with no role
- **Evidence:** axe "needs review" `aria-prohibited-attr` reported 7 nodes per kanban run. The same pattern, with redundant labels only, appears on the landing theme preview (3 `div`s) and the establishment "Opening hours" `div` (see Scope and method). The accessibility snapshot shows the lane count as bare text `"1"` and the timer as `timer: 00:00`. The labels "1 loaded order" and "Elapsed 00:00" are not exposed, because a name is prohibited on a generic `span`.
- **Impact:** Kitchen screen-reader users hear unexplained numbers. This is hygiene under WCAG 1.3.1. The headings and visible text still give partial context.
- **Severity:** Could
- **Fix direction:** Put the label text in visually hidden text inside the badge, or give the badge an appropriate role (`role="status"` is not appropriate here).
- **Regression test:** None
- **Status:** Confirmed

### A11Y-18 — Opening-hours editor uses a native time input for "Opens" but free text for "Closes"

- **Workstream:** W6
- **Location:** `apps/frontend/components/workspace/settings/restaurants/opening-hours-editor.tsx:185-188` (`type="time"`) and `:207-212` (`type="text" inputMode="numeric" maxLength={5}`)
- **Evidence:** Source only. No dev fixture renders `section="hours"` (`establishment-design-test` uses the default section), and the live settings page needs the API. The "Closes" field has no format hint beyond its prefilled `17:00`. Each day is a `fieldset` with a visually hidden `legend` (`:139-146`), and labels are associated.
- **Impact:** Possible WCAG 3.3.2 Labels or Instructions gap. The pair is inconsistent: a native time picker for one field and free text with no stated format for the other. Owners using assistive technology get different interaction models for the two ends of the same period.
- **Severity:** Could
- **Fix direction:** Use the same input type for both fields (or add an "HH:MM" hint through `aria-describedby`). Add a dev fixture or Playwright project that renders the hours section.
- **Regression test:** None
- **Status:** Suspected

### A11Y-19 — Workspace context select navigates to another workspace on change

- **Workstream:** W6
- **Location:** `apps/frontend/components/workspace/shared/workspace-shell.tsx:112-116` (native "Workspace context" select, `onChange={(event) => changeContext(event.target.value)}`) and `:77-90` (`changeContext` calls `router.push` to the selected restaurant or organization)
- **Evidence:** Source: every value change immediately navigates to another workspace, with no confirmation and no warning in the label. Chrome on Windows usually commits a closed native select's value on ArrowUp or ArrowDown, and so does the storefront select in this run (A11Y-15). In this headless run, though, ArrowDown on the workspace select left its value at `""` and the URL unchanged. Only one organization and one restaurant exist in the fixture, so the keyboard behaviour is not reproduced.
- **Impact:** WCAG 3.2.2 On Input (A), failure F37, if arrow keys commit the value. A keyboard owner or manager looking through the options would be taken to another restaurant's or organization's workspace on the first arrow press, losing the current page and any unsaved draft. The page can still be used through the native picker (Alt+ArrowDown, then Enter), so this is not a Blocker.
- **Severity:** Should
- **Fix direction:** Navigate only on explicit confirmation (a "Go" button, or a menu-button or listbox pattern that commits on Enter), or replace the select with a list of links.
- **Regression test:** Sketch below
- **Status:** Suspected

```text
Windows Chrome, headed, workspace with two or more restaurants: focus "Workspace context", press ArrowDown
Expected: no navigation until the user confirms the choice
Actual (source): onChange → router.push on the first value change
```

## Checked, no finding

- `html[lang]` matches the URL locale on every page tested (192/192 axe runs; `apps/frontend/app/[locale]/layout.tsx:31`). Kanban tickets mark menu-language parts (`components/orders/order-ticket.tsx:112`).
- Reflow (1.4.10): no horizontal page scroll in any of the 192 runs at 320 and 1280 px. The 200% browser-zoom equivalent (640 CSS px, DPR 2) showed no horizontal scroll or off-screen content on 9 pages (builder, kanban, establishment, sign-in, storefront, demo checkout, order history, live workspace, studio parity).
- Kanban dragging alternative (2.5.7): the "Start preparing", "Mark ready" and "Complete order — order 22222222" buttons moved an order from Pending to Completed with Enter only. Instructions are exposed through `aria-describedby="order-drag-instructions"` (`order-ticket.tsx:111`, `order-kanban.tsx:256-258`). Drag can be cancelled with Escape (`hooks/use-order-drag.ts:34-38`), and drag state is announced in a polite status region (`order-kanban.tsx:260-268`).
- Target size (2.5.8): no target smaller than 24 × 24 px fails the spacing test on any sampled page. The smallest are the 20 × 20 checkboxes (spacing satisfied, with labels as larger targets) and the 32 × 32 basket steppers and drag handles. Text links such as "Forgot password?" (16 px tall) pass by spacing.
- Redundant entry (3.3.7): sign-up asks for name, email and one password (no confirmation field). Checkout asks for name, phone and optional email once, on a single page.
- Accessible authentication (3.3.8): email `autocomplete="email"` and password `autocomplete="current-password"` (sign-in) or `new-password` (sign-up). A synthetic paste into the password field was not cancelled. A "Show password" toggle exists. No CAPTCHA, puzzle or transcription step. Social sign-in buttons were not rendered (no client IDs in the probe environment).
- Identify input purpose (1.3.5): checkout `customerName` `autocomplete="name"`, `customerPhone` `autocomplete="tel"`. The auth fields are as above.
- Dialog focus management: the product dialog opens with focus on "Close", Tab cycles inside it, and Escape returns focus to "Add Soup". The basket sheet opens on "Close". The menu-builder "New category" dialog and the category actions menu return focus to their triggers on Escape. Exceptions are in A11Y-08.
- Bypass blocks (2.4.1): the workspace shell has a "Skip to content" link (`components/workspace/shared/workspace-shell.tsx:95-97`). Auth and storefront pages expose `banner`, `main` and `navigation` landmarks.
- Error identification and suggestion (3.3.1, 3.3.3): the failed sign-in shows `role="alert"` text. Native validation names the missing `@` and the 8-character minimum on sign-up. Checkout quote failures use `role="alert"` with a "Recalculate total" action (`components/storefront/live-checkout.tsx:170-188`). The pickup-unavailable message is `role="status"`.
- Status messages elsewhere (4.1.3): the checkout "quote loading" and "placing order" `role="status"` (`live-checkout.tsx:165`, `:221`), the tracking status label `role="status"` (`components/storefront/demo/tracking/customer-tracking.tsx:103`), the kanban timers `aria-live="off"` (`order-ticket.tsx:185`), and the Next.js route announcer on checkout navigation.
- Focus not obscured (2.4.11): at 320 × 640, no keyboard focus stop was fully covered on the storefront, kanban, builder, establishment or demo checkout pages.
- Non-text contrast of inputs (1.4.11): auth and establishment field borders are 18.13:1 against their backgrounds. Exception: A11Y-02's menu highlight.
- Labels (3.3.2, 4.1.2) on the real-product fixtures: no unlabeled input, select or textarea in the builder product editor, establishment form, auth forms or checkout. The discount code field is labelled with `aria-label` and a placeholder.
- Keyboard operability (2.1.1, 2.1.2): the guest journey up to the disabled "Place order", kanban status moves, and builder tabs, dialogs, menus and editor are all keyboard-operable, with no traps (Tab cycles back to the top). No single-character shortcuts exist (2.1.4). Every `onKeyDown` handler in `components` and `hooks` is scoped to a focused control and reacts only to non-character keys:
  - Escape: `marketing-header.tsx:31`, `menu-builder-product.tsx:85`, `use-order-drag.ts:34`;
  - arrows: the builder, option-group and photo-gallery handlers;
  - Home and End: the Studio tabs, `studio/page/sections/section-02.tsx:22-26`;
  - Backspace: `order-email-template-field.tsx:185`;
  - Enter, in two handlers: `menu-language-settings-form.tsx:154` and `order-email-template-field.tsx:177`.
- Dark theme: not applicable at runtime. Light and dark `colorScheme` runs gave identical axe results because the runtime forces light (`layout.tsx:31`; `docs/design-system/README.md:7`).
- Reduced motion: the only perpetual animation on the landing page is a small decorative dot gated by `motion-safe:animate-pulse` (`components/marketing/landing-hero.tsx:23`). Global `prefers-reduced-motion` rules exist (`app/globals.css:248`, `components/theme/landing-demo.css:396`, `:559`).
- No audio or video in `apps/frontend/components` (`<video`, `<audio`, YouTube or Vimeo: 0 matches).

## Not covered

- **API-backed pages.** The real organization workspace routes (orders dashboard, catalog, restaurant settings including the opening-hours editor, team, analytics, Studio) need the API and database. The Neon `test` branch is about 13 migrations behind (`w3-public-surface.md`), and the production API returns 503 (HOST-01), so by controller ruling they were not run. Their shared components were exercised through the dev fixtures, so findings on shared components (A11Y-02, A11Y-07, A11Y-08, A11Y-11, A11Y-12, A11Y-17) apply to them by source.
- **Order placement, receipt and live tracking.** The guest fixture (`tests/fixtures/checkout-api.mjs`) predates the quote and pickup-slot endpoints. `/api/public/pickup-slots` returned 404 and `/api/public/order-quote` returned 403 under the fixture host, so "Place order" stayed disabled. The invalid-discount message, focus after placement and receipt announcements were therefore reviewed in source only (`live-checkout.tsx:43-60`, `:170-197`). Nothing in the storefront calls `focus()` after placement, so focus loss after "Place order" is likely (an extension of A11Y-08), but it is unverified. The demo checkout and tracking pages, which share the renderers, were swept with axe.
- **Screen readers.** NVDA, JAWS, VoiceOver and TalkBack were not run. Names, roles and live regions were judged from the browser accessibility tree and DOM observation, which can differ from real announcements.
- **Real zoom and OS settings.** Browser text-size settings, OS text scaling, Windows forced colours and high-contrast mode were not exercised. Text resize was emulated by root font size and zoom by a 640 CSS px viewport.
- **Touch.** No touch-device or long-press testing. The kanban touch drag path (`use-order-drag.ts`) was not exercised.
- **Navigation-dependent criteria.** 3.2.6 Consistent Help and 2.4.5 Multiple Ways depend on real navigation and establishment data, and were not assessed.
- **axe needs-review contrast.** axe left 1,004 `color-contrast` nodes as "needs review" over 60 runs, all on the landing and demo pages; it cannot decide on text over images, gradients or overlapping layers. They were not triaged one by one. A11Y-13 and A11Y-03 already record the confirmed contrast failures on those renderers, and a manual pass over the remaining nodes is left for the remediation of A11Y-13.
- **Lighthouse** not run (install not approved). Hosted pages were not probed for W6.
- **Locales.** Keyboard and focus runs were made in `en`. `fr` was covered by the axe sweep, the language probe and the `fr` copies of every page, and none of the focus findings depends on locale.

## ASVS / WCAG coverage

ASVS 4.0.3 is not applicable to W6, which is the WCAG 2.2 accessibility workstream. Every WCAG 2.2 level A and AA success criterion:

| Criterion | Level | Result |
| --- | --- | --- |
| 1.1.1 Non-text Content | A | Fail (A11Y-12) |
| 1.2.1 Audio-only and Video-only (Prerecorded) | A | Not applicable |
| 1.2.2 Captions (Prerecorded) | A | Not applicable |
| 1.2.3 Audio Description or Media Alternative (Prerecorded) | A | Not applicable |
| 1.2.4 Captions (Live) | AA | Not applicable |
| 1.2.5 Audio Description (Prerecorded) | AA | Not applicable |
| 1.3.1 Info and Relationships | A | Pass (hardening in A11Y-14, A11Y-17) |
| 1.3.2 Meaningful Sequence | A | Pass |
| 1.3.3 Sensory Characteristics | A | Pass |
| 1.3.4 Orientation | AA | Pass |
| 1.3.5 Identify Input Purpose | AA | Pass |
| 1.4.1 Use of Color | A | Fail (A11Y-05) |
| 1.4.2 Audio Control | A | Not applicable |
| 1.4.3 Contrast (Minimum) | AA | Fail (A11Y-03, A11Y-04, A11Y-13) |
| 1.4.4 Resize Text | AA | Pass (by browser zoom; text-only clipping in A11Y-11) |
| 1.4.5 Images of Text | AA | Pass |
| 1.4.10 Reflow | AA | Pass |
| 1.4.11 Non-text Contrast | AA | Fail (A11Y-02, menu highlight) |
| 1.4.12 Text Spacing | AA | Fail (A11Y-11) |
| 1.4.13 Content on Hover or Focus | AA | Not tested |
| 2.1.1 Keyboard | A | Fail (A11Y-12) |
| 2.1.2 No Keyboard Trap | A | Pass |
| 2.1.4 Character Key Shortcuts | A | Pass |
| 2.2.1 Timing Adjustable | A | Pass (tested journeys; session expiry not tested) |
| 2.2.2 Pause, Stop, Hide | A | Pass |
| 2.3.1 Three Flashes or Below Threshold | A | Pass |
| 2.4.1 Bypass Blocks | A | Pass |
| 2.4.2 Page Titled | A | Fail (A11Y-01) |
| 2.4.3 Focus Order | A | Fail (A11Y-08) |
| 2.4.4 Link Purpose (In Context) | A | Fail (A11Y-10) |
| 2.4.5 Multiple Ways | AA | Not tested |
| 2.4.6 Headings and Labels | AA | Fail (A11Y-14) |
| 2.4.7 Focus Visible | AA | Fail (A11Y-02) |
| 2.4.11 Focus Not Obscured (Minimum) | AA | Pass |
| 2.5.1 Pointer Gestures | A | Pass |
| 2.5.2 Pointer Cancellation | A | Pass |
| 2.5.3 Label in Name | A | Pass |
| 2.5.4 Motion Actuation | A | Not applicable |
| 2.5.7 Dragging Movements | AA | Fail (A11Y-07; kanban passes) |
| 2.5.8 Target Size (Minimum) | AA | Pass |
| 3.1.1 Language of Page | A | Pass |
| 3.1.2 Language of Parts | AA | Fail (A11Y-06) |
| 3.2.1 On Focus | A | Pass |
| 3.2.2 On Input | A | Fail suspected (A11Y-19, workspace context select); Pass (borderline) for the storefront select only (A11Y-15) |
| 3.2.3 Consistent Navigation | AA | Pass |
| 3.2.4 Consistent Identification | AA | Fail (A11Y-14) |
| 3.2.6 Consistent Help | A | Not tested |
| 3.3.1 Error Identification | A | Pass |
| 3.3.2 Labels or Instructions | A | Fail (A11Y-13, demo field; A11Y-18 suspected) |
| 3.3.3 Error Suggestion | AA | Pass |
| 3.3.4 Error Prevention (Legal, Financial, Data) | AA | Pass (checkout page is the review step before "Place order"; placement not run) |
| 3.3.7 Redundant Entry | A | Pass |
| 3.3.8 Accessible Authentication (Minimum) | AA | Pass |
| 4.1.1 Parsing | A | Not applicable (removed in WCAG 2.2) |
| 4.1.2 Name, Role, Value | A | Fail (A11Y-10, A11Y-13; hygiene A11Y-16) |
| 4.1.3 Status Messages | AA | Fail (A11Y-09) |

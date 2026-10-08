# WhitePlate design system

Version **2.1.0**, 8 October 2026. Direction: **Culinary Commerce System**.

This is WhitePlate's single canonical design reference, replacing the former Porcelaine, encre et sauge direction. The palette, font stacks, spacing, radius, breakpoints, and type scale are mirrored in shared frontend variables. That token migration does not mean every screen recipe or illustrative component in this document is implemented. Broader screen and component adoption is tracked separately in [issue #53](https://github.com/whritou/WhitePlate/issues/53); this replacement is tracked in [issue #52](https://github.com/whritou/WhitePlate/issues/52).

[Static token preview](overview.svg) · [Canonical tokens](tokens.json) · [Validator and preview generator](verify.py) · [Frontend architecture](../architecture/WHITEPLATE_FRONTEND_ARCHITECTURE.md) · [Implementation conventions](../architecture/frontend-conventions.md)

## Design intent

WhitePlate supports restaurant operations, kitchen order handling, and guest ordering. The system pairs an operationally calm obsidian/slate foundation with a clear tangerine action color and mint success signal. Dense operational information should remain legible at a glance; guest ordering can give food and restaurant identity more room.

- **Make context and next action clear.** Keep the organization, order, or menu context apparent and give each decision area one primary action.
- **Keep service information readable.** Prioritize order references, item names, quantities, prices, and status. Avoid motion and decoration that compete with those details.
- **Use semantic color consistently.** Status color supports a text or icon label. Color alone never communicates order state, errors, or selection.
- **Adapt density by surface.** Back-office screens may use denser tables and grids; storefronts may use more open product layouts.
- **Keep behavior authoritative.** The server remains the authority for tenant access, price, discounts, order state, and checkout outcomes.

## Source palette and semantic tokens

The attachment's named prose HEX values take priority over conflicting values in its YAML palette. The exact supplied palette is preserved in `sourcePalette` in [tokens.json](tokens.json). The runtime uses accessible foreground/text and tint roles, while keeping the named solid colors available for indicators and visual examples.

| Role | Light | Dark | Use |
| --- | --- | --- | --- |
| `background` | `#F8F9FF` | `#020617` | Canvas |
| `foreground` | `#0B1C30` | `#F8FAFC` | Main text |
| `card` | `#FFFFFF` | `#0B0F19` | Work surface |
| `popover` | `#FFFFFF` | `#1E293B` | Menus and overlays |
| `primary` | `#FF5A1F` | `#FF5A1F` | Main action |
| `primary-foreground` | `#0F172A` | `#0F172A` | Text on a primary action |
| `primary-hover` | `#F97316` | `#F97316` | Hover/pressed action |
| `secondary` | `#E5EEFF` | `#1E293B` | Secondary controls |
| `muted` | `#EFF4FF` | `#0B0F19` | Quiet surfaces and disabled state |
| `muted-foreground` | `#45464D` | `#CBD5E1` | Supporting text |
| `accent` | `#FFF7ED` | `#1E293B` | Subtle selection surface |
| `border` | `#DCE9FF` | `#334155` | Surface separation |
| `input` | `#64748B` | `#94A3B8` | Visible control outline |
| `ring` | `#0F172A` | `#F97316` | Keyboard focus |

The primary action uses Obsidian text: `#0F172A` on `#FF5A1F` is **5.72:1**. White on the same orange is **3.12:1**, below the 4.5:1 normal-text target. Hover orange `#F97316` also uses Obsidian text.

The supplied operational colors are:

| State | Solid | Light text | Light tint |
| --- | --- | --- | --- |
| Pending / action required | `#F59E0B` | `#B45309` | `#FEF3C7` |
| Preparing / in kitchen | `#3B82F6` | `#1D4ED8` | `#DBEAFE` |
| Ready / handed off | `#10B981` | `#047857` | `#D1FAE5` |
| Cancelled / refunded | `#EF4444` | `#B91C1C` | `#FEE2E2` |

The dark theme retains the same solid status colors and uses lighter status text on dark tints to preserve legibility. Alert and order-status labels use the text/tint pair; a solid color is for a compact indicator and is not a substitute for its text label. The source status palette remains recorded unchanged in JSON.

The auxiliary light accent tint `#FFF7ED` fills the accent role where the source gives no separate accent HEX. Dark status tints and their lighter text variants are theme adaptations for contrast; they do not change the supplied status palette.

## Typography

The attachment's YAML scale is represented in `typography` in [tokens.json](tokens.json) and exposed through Tailwind's named text tokens. Use **Plus Jakarta Sans** for headlines, dish names, and KPI figures; use **Inter** for body copy, modifiers, labels, and tabular data. Use tabular numerals for live order and KPI values.

Inter and Plus Jakarta Sans are bundled in `apps/frontend/public/design` and loaded with local `@font-face` declarations using swap. No remote font request is made. System fallback stacks remain available.

## Shape, spacing, and responsive values

| Token | Value |
| --- | ---: |
| Radius `sm` / `default` / `md` / `lg` / `xl` | 0.25 / 0.5 / 0.75 / 1 / 1.5 rem |
| Radius `full` | 9999 px |
| Spacing `xs` / `sm` / `md` / `lg` / `xl` | 0.25 / 0.5 / 1 / 1.5 / 2.5 rem |
| Desktop gutter / mobile gutter | 1.5 / 1 rem |
| Desktop margin / mobile margin | 2 / 1 rem |
| Storefront max width (design target) | 1280 px |

Responsive ranges from the attachment are mobile below 640px, tablet from 640px to 1024px, desktop from 1024px to 1440px, and ultra-wide above 1440px. These are named custom breakpoint tokens; existing default Tailwind breakpoints remain intact so this token migration does not silently change current page layouts. The shared CSS also exposes `gutter`, `gutter-mobile`, `margin`, and `margin-mobile` variables for later screen adoption.

## Surface and elevation guidance

The supplied dark foundation is canvas `#020617`, layer 1 `#0B0F19`, layer 2 `#1E293B`, and border `#334155`. The earlier source border `#E2E8F0` and muted source color `#F1F5F9` remains recorded in sourcePalette. The full Stitch screen exports refine the light foundation to canvas `#F8F9FF`, white surface `#FFFFFF`, muted surface `#EFF4FF`, and border `#DCE9FF`. Their named presentation roles are recorded in `presentationPalette` and mapped to semantic runtime variables, with dark adaptations.

The following shadows and 12px backdrop blur are design guidance, not a claim that all surfaces or overlays currently use these effects:

| Level | Shadow | Intended example |
| --- | --- | --- |
| 0 | None | Canvas |
| 1 | `0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)` | Resting card |
| 2 | `0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.06)` | Hovered or sticky surface |
| 3 | `0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)` | Drawer or modal |

Respect reduced-motion preferences. Motion must not be the only signal for a status or outcome.

## Product and implementation boundaries

Design examples describe a target or illustration. They do not add product behavior or assert that related source data exists.

| Example in the supplied design | Reference status |
| --- | --- |
| Restaurant rating or preparation-time claim | Illustrative/future unless its value and source are implemented and verified |
| Dietary flags such as vegan | Illustrative/future unless backed by verified catalog data |
| Animated progress toward free delivery or a minimum order | Illustrative/future; do not infer pricing or eligibility |
| ASAP/scheduled pickup selector and available time slots | Illustrative/future unless scheduling is implemented and server-backed |
| `--tenant-primary`, `--tenant-radius`, `--tenant-font` customization engine | Illustrative/future; no tenant CSS injection or runtime tenant theme is implied |
| Restaurant hero ratios, editorial dish cards, quick-add counters, KPI sparklines, kitchen timers, modifier modal | Visual recipes; apply only where matching product behavior and data already exist |

Current API and source contracts take precedence. Do not infer a tenant feature, rating, schedule, delivery promise, or dietary fact from a mockup. Tenant identity supplied by the browser is only a selector and never grants authorization. Tenant ownership must remain enforced for reads, writes, caches, and real-time subscriptions.

## Accessibility, localization, and state behavior

- Keep controls keyboard operable with visible focus and predictable focus restoration after dialogs, drawers, and failed actions.
- Preserve semantic headings, accessible names, live-region announcements, and text/icon status labels. Do not depend on color alone.
- Keep touch targets at least 44px under existing shared-control rules; use at least 48px for tablet back-office controls as specified in the new design.
- Maintain readable disabled controls and distinguish loading, empty, pending, error, success, and offline states. Provide retry only when the existing operation contract supports it.
- Respect reduced motion and 200% text zoom without hiding required actions or content.
- Keep user-visible copy in both English and French translation catalogs. A visual token change does not authorize untranslated copy or locale behavior changes.
- Keep prices, discounts, tenant authorization, order status transitions, checkout receipts, and retry/idempotency behavior server-authoritative and unchanged by design work.

## Runtime mapping and verification

`tokens.json` is the structured source for shared light/dark colors, typography, radii, spacing, and breakpoints. The frontend mirrors semantic color values in `apps/frontend/app/globals.css`; Tailwind theme aliases expose the font, color, spacing, radius, breakpoint, and type tokens. The client does not import the JSON. `apps/frontend/app/design-tokens.test.ts` remains the existing runtime color/radius parity check.

Run the reference validator from the repository root:

```sh
py -3 docs/design-system/verify.py
```

Regenerate the static token board with:

```sh
py -3 docs/design-system/verify.py --render
```

The SVG is generated from tokens and is not a screenshot or verification of rendered app screens. This token replacement does not verify application contrast, component behavior, or page-level layout adoption. Existing frontend checks and broader screen adoption remain separate work.

## Superseded reference history

The following entries record prior user-approved revisions and are retained as historical evidence only; none is active guidance now.

| Version | Date | Historical record |
| --- | --- | --- |
| 1.0.0 | 2026-10-06 | Initial Porcelaine et encre reference and light/dark token set. |
| 1.1.0 | 2026-10-06 | Prior revision selected neutral light surfaces, stone dark surfaces, and sage accent. |
| 1.2.0 | 2026-10-07 | Prior revision adjusted sage accent, contrast data, and static preview. Superseded by version 2.0.0. |
| 2.0.0 | 2026-10-08 | Replaced the active system with the user-supplied Culinary Commerce System and migrated shared color/font/layout tokens. |

## Full Stitch redesign adoption — 8 October 2026

The user supplied the complete five-screen export and explicitly authorized illustrative data for missing backend capabilities. The landing page follows the exported layout; `/[locale]/demo`, `/demo/checkout`, `/demo/tracking`, and `/demo/dashboard` provide the four screen recipes with an in-memory cart and simulated order handling. Navigation among these routes preserves the preview cart during the session. Refreshing resets it. Payments never charge a card; masked payment fields are read-only. Preview scheduling, notifications, customization, stock controls, KPI data and order transitions do not write to a server.

The existing tenant storefront, checkout, order tracking, auth frames, catalog cards, order tickets and workspace shell adopt the same tokens and imagery. Existing checkout validation, tenant authorization, query ownership and tracking capabilities remain in their established modules. Food photos are illustrative assets from the export, not catalog attachments. The live checkout includes clearly marked payment/scheduling illustrations alongside its existing authoritative order form.

Intentional adaptations: WhitePlate replaces the source brand; normal-size orange buttons retain accessible dark text; Lucide icons replace the source icon font; dark mode, EN/FR copy, keyboard controls and mobile stacking extend the desktop references. Real backend-backed scheduling, payment, analytics, product media and tenant customization remain future work. The landing page is the real public marketing page, as clarified by the user; it does not display a demo notice. Its supplied marketing content is kept separate from simulated restaurant operations.

See [redesign verification and handoff](../redesign-handoff.md) for actual checks and remaining limitations.

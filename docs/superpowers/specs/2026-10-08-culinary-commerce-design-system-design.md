# Culinary Commerce System replacement and runtime tokens

**Date:** 2026-10-08
**Status:** Approved by user 2026-10-08; implementation in progress
**Scope:** Canonical design-system documentation, design tokens, static preview, shared frontend CSS/theme variables, one semantic status-color utility mapping, and documentation that describes runtime adoption

## Context

The user supplied `DESIGN.md` as the new WhitePlate design direction and confirmed that it replaces the previous canonical system. The current canonical reference is “Porcelaine, encre et sauge.” Its token JSON is also consumed by `apps/frontend/app/design-tokens.test.ts`, which compares the top-level light/dark palette and radii to the runtime CSS. Updating both sides together preserves that parity contract. The current design documentation and architecture describe the old palette as already adopted.

The new attachment contains named prose HEX values that conflict with its YAML color table. The user selected the named prose HEX values as authoritative. The attachment's YAML provides typography, spacing, and radii. Its prose provides breakpoint ranges; it contains no YAML breakpoint tokens. The user first approved a reference-only scope, then explicitly expanded approval to replace the old design system and update frontend CSS variables. The existing color/radius parity test reads the top-level `themes` and `radiusRem` token groups; those groups will now contain Culinary Commerce values and remain aligned with the corresponding CSS variables.

## Goals

- Replace the canonical direction in `docs/design-system` with **Culinary Commerce System**.
- Make the named prose palette, dark surfaces, and operational status colors authoritative in the canonical token set.
- Replace current frontend semantic color, font-family, radius, and system-dark-mode CSS variable values with the new tokens while retaining existing variable names and component contracts.
- Carry forward the existing project's accessibility, localization, focus/keyboard, reduced-motion, UI-state, retry, and tenant-isolation requirements.
- Keep illustrative or unverified product features separate from implemented behavior.
- Correct documentation that describes only the previous design direction or overstates runtime adoption.
- Keep frontend color/radius parity checking aligned by replacing the old JSON values together with their CSS variable values.

## Non-goals

- Changing component structure, page-specific layouts/styles, translations, APIs, product behavior, or test source. A status-indicator class may be remapped to the new solid-status token to preserve its visual meaning.
- Applying every component recipe or rearranging existing screens; broader screen-level design adoption remains a separate kanban item.
- Implementing features depicted in the attachment that are not already verified in the product.
- Changing application authentication, authorization, tenant boundaries, pricing, order transitions, cart behavior, or checkout retries.

## Proposed design

### Canonical source and runtime variables

`docs/design-system/README.md` remains the single normative design reference. Rename its active design direction to **Culinary Commerce System**. The old direction is removed from active guidance; dated documentation-review entries remain historical records.

Replace the old active values in `docs/design-system/tokens.json` with Culinary Commerce tokens, keeping the top-level `themes` and `radiusRem` shape consumed by `apps/frontend/app/design-tokens.test.ts`. Update the existing semantic variables in `apps/frontend/app/globals.css` for light, dark, and system-dark global not-found styles. Keep variable names and component contracts stable so existing shared primitives adopt the palette without markup changes. Set font-family variables to Plus Jakarta Sans and Inter with local system fallbacks; do not add a network font dependency or remote font fetch. Update `docs/design-system/verify.py` to validate the new canonical tokens and generate `overview.svg` from them, while keeping documentation explicit that the preview is a static reference rather than an application screenshot.

The JSON metadata and documentation must describe the new palette and frontend theme variables as Culinary Commerce. Do not claim that every component recipe or screen-level refinement has been adopted just because shared variables have changed.

### Palette and contrast

Use the named prose values as the authority when they conflict with the YAML color table:

- Structural identity: Obsidian `#0F172A` and Warm Charcoal `#1E293B`.
- Tangerine actions/accent: `#FF5A1F` and `#F97316`.
- Mint: `#10B981`.
- Light surfaces: canvas `#F8FAFC`, surface `#FFFFFF`, muted surface `#F1F5F9`, border `#E2E8F0`.
- Dark surfaces: canvas `#020617`, layer 1 `#0B0F19`, layer 2 `#1E293B`, border `#334155`.
- Operational statuses: pending/action required `#F59E0B` with text `#B45309` and tint `#FEF3C7`; preparing/in kitchen `#3B82F6` with text `#1D4ED8` and tint `#DBEAFE`; ready/handed off `#10B981` with text `#047857` and tint `#D1FAE5`; cancelled/refunded `#EF4444` with text `#B91C1C` and tint `#FEE2E2`.

Primary orange actions use Obsidian text `#0F172A` on `#FF5A1F`. The approved contrast calculation is 5.72:1; white text on that background is 3.12:1. Apply the same accessibility rule to all other roles: validate normal text at 4.5:1 and controls/focus boundaries at 3:1. Do not use a prose color such as `#64748B` for normal text on `#F1F5F9` if its contrast is below the required threshold; use an approved dark structural foreground for text or keep the lower-contrast value decorative. Color must not be the only status signal.

Retain the specified operational status hues and their light-theme text/tint pairs. On dark surfaces, use a status foreground that passes contrast against the selected dark layer and preserve the status meaning with text/icon as well as color. Add no new status hue. The verifier must calculate and check every defined text and control/focus pairing in both modes.

### Typography, layout, and shape tokens

Use the attachment's YAML typography scale and font pairing where prose does not conflict: Plus Jakarta Sans for headlines, dish names, hero hooks, and large KPI figures; Inter for body copy, modifiers, form labels, and table cells. Use tabular figures for live order and metric values. Keep all listed YAML sizes, weights, line heights, letter spacing, and named spacing values.

Use the attachment's YAML radius values (`0.25rem`, `0.5rem`, `0.75rem`, `1rem`, `1.5rem`, and pill) with the prose geometry guidance: `0.5rem` core radius; cards/modals up to `1rem`; pill badges and category filters remain fully rounded. Keep the YAML spacing values for gutters, margins, and named gaps. Expose the supplied spacing, type-scale, and prose breakpoint values as shared CSS/Tailwind tokens while leaving existing default Tailwind breakpoints and page layouts unchanged.

Use the prose breakpoint ranges: mobile below 640px, tablet 640–1024px, desktop 1024–1440px, and ultra-wide above 1440px. The attachment has no YAML breakpoint tokens, so these prose boundaries are authoritative for the new reference. Represent ranges without ambiguous overlap in JSON (640, 1024, and 1440px boundaries).

Document the attachment's surface elevation and shadow guidance as visual guidance, while allowing reduced-motion preferences and avoiding motion that conveys status without a non-motion signal. Global CSS/Tailwind variables cover the shared palette, font-family stacks, type scale, spacing, radii, and custom breakpoint tokens; screen-specific recipes remain guidance for later scoped adoption.

### Components and product boundaries

Document general component guidance and existing product patterns, but label unimplemented examples as illustrative/future unless source inspection verifies them. This includes ratings, preparation-time claims, dietary flags, animated free-delivery/minimum-order progress, pickup scheduling, and per-tenant CSS customization variables. The reference must not imply those features or their data sources exist.

Preserve existing behavior and cross-cutting requirements in the reference: English/French copy, accessible names, keyboard operation and visible/restored focus, reduced motion, distinct loading/error/pending/success states, retry semantics, server-authoritative pricing and status, and tenant isolation. Browser-provided tenant identity remains a selector and never grants authorization. Updating shared theme variables does not change these product contracts.

### Documentation and preview

Update the design-system README, token JSON, validator, generated SVG, and documentation that presently describes the old system as canonical or mirrored in runtime. At minimum inspect and update the design-system entry in `docs/README.md`, the frontend styling sections of `docs/development.md`, `docs/coding-standards.md`, `docs/architecture/WHITEPLATE_FRONTEND_ARCHITECTURE.md`, and `docs/architecture/frontend-conventions.md`, plus `docs/documentation-review.md`. Keep historical records accurate as historical evidence and append the new reference result rather than rewriting old verification claims.

The reference validator should check required canonical token structure, valid HEX values, required contrast pairs, palette/README agreement, and local documentation links. The preview generator should show the new palette and be clearly identified as a static system reference. The existing app test contract continues to check the runtime color/radius CSS variables against the new root token values.

## Acceptance criteria

- The design-system README identifies Culinary Commerce System as the sole canonical target and replaces the former active direction.
- Root token groups contain the prose-authoritative palette/status values and the approved YAML typography, spacing, and radius values; breakpoint boundaries follow the prose ranges.
- Orange primary action text is Obsidian and has at least 4.5:1 contrast on `#FF5A1F`.
- Defined normal-text and control/focus combinations meet their documented contrast thresholds in light and dark themes.
- The `themes` and `radiusRem` token groups match the corresponding `:root` and `.dark` CSS variables, preserving the frontend parity test contract with the new values.
- The validator and generated preview read the new root tokens, and the preview is clearly static/reference-only.
- Shared CSS/theme variables reflect the new palette, font-family stacks, type scale, spacing, radii, and custom breakpoints without changing page layouts or component structure.
- Active docs describe the new system; dated history continues to describe prior adoption accurately.
- Unverified storefront, kitchen, and tenant-branding examples are explicitly marked illustrative/future.
- No component structure, test source, or product behavior changes are included; the connected-state indicator uses the explicit solid mint utility while status labels keep the high-contrast text token.
- Broader screen-level adoption has its own backlog card, separate from the shared-token work in #52.

## Verification plan

- Run `py -3 docs/design-system/verify.py` from the repository root and record its actual result.
- Run `git diff --check`.
- Review JSON/CSS diffs to confirm top-level theme colors and radius values match in both modes.
- Do not run frontend tests or builds for this token-variable scope; no test source or component behavior changes are planned. The existing parity test contract remains intact but is not newly claimed as executed.

## Decisions

| Decision | Status | Consequence |
| --- | --- | --- |
| Culinary Commerce replaces the prior canonical design direction | Approved by user 2026-10-08 | `docs/design-system` remains the canonical reference location and is rewritten for this system. |
| Named prose HEX values override conflicting YAML colors | Approved by user 2026-10-08 | The prose palette is used in the canonical token groups. |
| Obsidian foreground on Tangerine primary actions | Approved by user 2026-10-08 | Orange primary actions meet text contrast without changing the approved orange. |
| Replace the old palette and update shared CSS token variables | Approved by user 2026-10-08 | Root canonical color/radius values and light/dark CSS variables change together; broader screen-level refinements stay separate. |
| Treat unverified product examples as illustrative/future | Approved by user 2026-10-08 | The design reference cannot imply those capabilities are implemented. |

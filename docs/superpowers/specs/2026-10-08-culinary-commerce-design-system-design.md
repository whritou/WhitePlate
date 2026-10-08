# Culinary Commerce System reference replacement

**Date:** 2026-10-08
**Status:** Proposed; awaiting user review
**Scope:** Canonical design-system documentation, design token reference, static preview, and documentation that describes current runtime adoption

## Context

The user supplied `DESIGN.md` as the new WhitePlate design direction and confirmed that it replaces the previous canonical system. The current canonical reference is “Porcelaine, encre et sauge.” Its token JSON is also consumed by `apps/frontend/app/design-tokens.test.ts`, which compares the top-level light/dark palette and radii to the unchanged runtime CSS. The current design documentation and architecture describe the old palette as already adopted.

The new attachment contains named prose HEX values that conflict with its YAML color table. The user selected the named prose HEX values as authoritative. The attachment's YAML provides typography, spacing, and radii. Its prose provides breakpoint ranges; it contains no YAML breakpoint tokens. The user approved keeping reference changes separate from runtime CSS, components, product behavior, and tests, while preserving the current top-level color/radius snapshot for parity checks.

## Goals

- Replace the canonical direction in `docs/design-system` with **Culinary Commerce System**.
- Make the named prose palette, dark surfaces, and operational status colors authoritative in the new nested canonical token set.
- Carry forward the existing project's accessibility, localization, focus/keyboard, reduced-motion, UI-state, retry, and tenant-isolation requirements.
- Keep illustrative or unverified product features separate from implemented behavior.
- Correct documentation that currently claims the new canonical reference is already mirrored by runtime CSS.
- Preserve current frontend token-parity inputs without editing frontend application source or tests.

## Non-goals

- Changing `apps/frontend/app/globals.css`, components, page styling, translations, application code, APIs, product behavior, or tests.
- Migrating current screens to the new system. Runtime adoption is a separate kanban item and remains pending.
- Implementing features depicted in the attachment that are not already verified in the product.
- Changing application authentication, authorization, tenant boundaries, pricing, order transitions, cart behavior, or checkout retries.

## Proposed design

### Canonical source and compatibility snapshot

`docs/design-system/README.md` remains the single normative design reference. Rename its active design direction to **Culinary Commerce System** and make clear that it is the approved target while runtime adoption is pending.

Add a `canonicalReference` object to `docs/design-system/tokens.json` for the new reference palette and design values. Keep the existing top-level runtime token groups, including `themes` and `radiusRem`, byte-for-byte unchanged because `apps/frontend/app/design-tokens.test.ts` reads the top-level light/dark palette and radii as a compatibility snapshot. Update only root metadata needed to identify the new canonical reference and pending adoption. Preserve the existing frontend test contract; do not edit the test or CSS. Update `docs/design-system/verify.py` to validate `canonicalReference` and generate `overview.svg` from that target, while keeping documentation explicit that the preview is a static reference rather than an application screenshot.

The JSON metadata and documentation must distinguish the current runtime snapshot from the new canonical target. The new target is canonical for future UI work; the legacy top-level token groups exist only so current CSS-parity checks continue to describe the unchanged runtime. Do not describe the runtime as already using Culinary Commerce.

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

Use the attachment's YAML radius values (`0.25rem`, `0.5rem`, `0.75rem`, `1rem`, `1.5rem`, and pill) with the prose geometry guidance: `0.5rem` core radius; cards/modals up to `1rem`; pill badges and category filters remain fully rounded. Keep the YAML spacing values for gutters, margins, and named gaps.

Use the prose breakpoint ranges: mobile below 640px, tablet 640–1024px, desktop 1024–1440px, and ultra-wide above 1440px. The attachment has no YAML breakpoint tokens, so these prose boundaries are authoritative for the new reference. Represent ranges without ambiguous overlap in JSON (640, 1024, and 1440px boundaries).

Document the attachment's surface elevation and shadow guidance as visual guidance, while allowing reduced-motion preferences and avoiding motion that conveys status without a non-motion signal. Avoid asserting that the target values are already present in CSS.

### Components and product boundaries

Document general component guidance and existing product patterns, but label unimplemented examples as illustrative/future unless source inspection verifies them. This includes ratings, preparation-time claims, dietary flags, animated free-delivery/minimum-order progress, pickup scheduling, and per-tenant CSS customization variables. The reference must not imply those features or their data sources exist.

Preserve existing behavior and cross-cutting requirements in the reference: English/French copy, accessible names, keyboard operation and visible/restored focus, reduced motion, distinct loading/error/pending/success states, retry semantics, server-authoritative pricing and status, and tenant isolation. Browser-provided tenant identity remains a selector and never grants authorization. Keep the reference separate from any runtime implementation.

### Documentation and preview

Update the design-system README, token JSON, validator, generated SVG, and documentation that presently describes the old system as canonical or mirrored in runtime. At minimum inspect and update the design-system entry in `docs/README.md`, the frontend styling sections of `docs/development.md`, `docs/coding-standards.md`, `docs/architecture/WHITEPLATE_FRONTEND_ARCHITECTURE.md`, and `docs/architecture/frontend-conventions.md`, plus `docs/documentation-review.md`. Keep historical records accurate as historical evidence and append the new reference result rather than rewriting old verification claims.

The reference validator should check required canonical token structure, valid HEX values, required contrast pairs, palette/README agreement, and local documentation links. The preview generator should show the new palette and distinguish the reference from current runtime styling. The existing app test remains the check for the legacy runtime color/radius snapshot.

## Acceptance criteria

- The design-system README identifies Culinary Commerce System as the sole canonical target and states that runtime adoption is pending.
- `canonicalReference` contains the prose-authoritative palette/status values and the approved YAML typography, spacing, and radius values; breakpoint boundaries follow the prose ranges.
- Orange primary action text is Obsidian and has at least 4.5:1 contrast on `#FF5A1F`.
- Defined normal-text and control/focus combinations meet their documented contrast thresholds in light and dark themes.
- The existing top-level `themes` and `radiusRem` values are unchanged, preserving the current frontend parity test contract.
- The validator and generated preview read the new nested canonical target, and the preview is clearly static/reference-only.
- Docs no longer claim that the new target is already mirrored by runtime; history continues to describe prior adoption accurately.
- Unverified storefront, kitchen, and tenant-branding examples are explicitly marked illustrative/future.
- No application source, CSS, component, test, or product behavior changes are included.
- Runtime adoption has its own backlog card, separate from the reference-update card.

## Verification plan

- Run `py -3 docs/design-system/verify.py` from the repository root and record its actual result.
- Run `git diff --check`.
- Review JSON diff to confirm the top-level `themes` and `radiusRem` snapshots are unchanged.
- Do not run frontend tests or builds for this documentation/token-reference-only scope; no frontend source or test changes are planned. Existing parity remains represented by its unchanged inputs, not newly claimed as re-verified.

## Decisions

| Decision | Status | Consequence |
| --- | --- | --- |
| Culinary Commerce replaces the prior canonical design direction | Approved by user 2026-10-08 | `docs/design-system` remains the canonical reference location and is rewritten for this system. |
| Named prose HEX values override conflicting YAML colors | Approved by user 2026-10-08 | The prose palette is used in nested canonical tokens. |
| Obsidian foreground on Tangerine primary actions | Approved by user 2026-10-08 | Orange primary actions meet text contrast without changing the approved orange. |
| Keep current runtime color/radius snapshot and defer CSS adoption | Approved by user 2026-10-08 | The old top-level parity values stay intact; a separate runtime backlog task tracks future migration. |
| Treat unverified product examples as illustrative/future | Approved by user 2026-10-08 | The design reference cannot imply those capabilities are implemented. |

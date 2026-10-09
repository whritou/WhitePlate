# Frontend interaction contrast and density audit

9 October 2026. Project-wide source review following a report of a narrow category rail, unclear blue hover states and excessive padding.

## Coverage and findings

Reviewed the shared design tokens and runtime stylesheet, shared control variants, and interactive/color/spacing utility classes across the frontend route and component source tree (216 files under `apps/frontend/app` and `apps/frontend/components`). This was a source-level review of all route families, with targeted inspection of the menu builder, navigation, marketing previews, storefront filters, auth and shared controls.

- Selected organization navigation used the same light hover fill as an unselected row while retaining white text. That made selected text unreadable in light mode. Selected rows now stay dark on hover; inactive rows use a stronger surface hover with foreground text.
- Inactive tabs used the selected tab's white surface on hover. Hover and selected states now have separate fills, and the selected tab retains its border marker.
- Secondary/ghost hover fills were too close to their light blue rest state. Shared controls now use the defined surface-variant hover and surface-dim pressed roles. Pressed secondary/ghost buttons also show a high-contrast brand border, including dark mode. Outline, destructive and primary actions have distinct pressed feedback.
- Normal orange text `#FF5A1F` on white measured **3.12:1**, below the **4.5:1** normal-text target. Small brand text across routes now uses a theme-aware foreground: light `#9F3514`, dark `#FF9878`. Ratios against the complete pale and dark surface sets range from **5.01:1 to 7.31:1** in light and **4.94:1 to 9.62:1** in dark. Solid orange controls keep the existing dark foreground; that foreground measures **5.72:1** at rest, **6.37:1** on hover orange and **5.35:1** for the shared pressed state after the control's brightness effect.
- The menu builder category rail measured 14–16rem. It now receives 18rem at desktop and 20rem at wide desktop. Category rows use less vertical padding while keeping 44px shared-control targets.
- Shared cards used a 20px default spacing value. The shared recipe now uses 16px. Tabs retain a 48px minimum touch height while reducing horizontal and vertical padding.

The bright orange source palette stays unchanged. `brand-text` and component interaction behavior are documented in the canonical [design system](../design-system/README.md) and checked by its [token validator](../design-system/verify.py).

## Verification

- `py -3 docs/design-system/verify.py`: passed, validating **119** light/dark contrast pairs for brand text, secondary hover/pressed states, focus rings and the rendered primary pressed state, plus CSS/token parity and documentation links. The lowest normal-text pair is the existing light warning tint at **4.51:1**; the lowest focus/control pair is the dark ring against slate at **3.69:1**.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `node node_modules/prettier/bin/prettier.cjs --check <changed TypeScript files>`: passed.
- `node node_modules/next/dist/bin/next build --webpack`: passed with process-only dummy HTTPS service origins. Existing PostgreSQL SSL-mode deprecation warnings remain.
- `git diff --check`: passed. No application tests were added or run for these styling changes.

This is code-level contrast and interaction-state evidence; it does not claim an exhaustive visual screenshot review of every route or device. M5's photo/editor screenshots remain separately recorded in [the product photo audit](product-photos.md).

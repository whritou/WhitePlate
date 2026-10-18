# Storefront–Studio theme parity

The real customer storefront now applies the Studio appearance tokens consistently to page, card and popover surfaces, text, button states, typography, scale, line height, spacing, corner radius, product layout and image ratio. Theme styles also cover checkout. Outline buttons keep the configured primary foreground against the store background; hover, pressed, selected and keyboard-focus states remain visible. The demo and Studio implementation remain unchanged; Studio is used as the comparison reference.

The live product cards now use the selected body font and spacing, and customer product photos carry the restaurant slug through to their public image URLs. Checkout renders the real pickup-time selector and optional email and analytics consent controls, replacing the nonfunctional sample inputs. The collection details use the configured spacing and the real banner uses its selected overlay strength.

The parity browser fixture applies one saved Studio appearance to the live Studio component and the published-theme storefront fixture. It compares shared theme variables in EN and FR at 320, 390, 768, 1024, 1440 and 1920 px, verifies no horizontal page overflow, and checks outline hover and pressed feedback. It covers frontend theme application; it does not establish production database persistence, hosted publication, or the exact sameness of Studio sample content and the real menu.

## Verification

- Frontend unit tests: 112 files, 717 tests passed.
- TypeScript: `node node_modules/typescript/bin/tsc --noEmit` passed.
- Changed-file formatting: Prettier passed. The repository-wide format check still reports existing formatting differences across 692 files; those unrelated files were not reformatted.
- Browser checks: `storefront-customer-parity` passed 8/8 tests in EN/FR, including the responsive Studio/store theme comparison.
- Repository ESLint completed with 0 errors and 19 existing `<img>` performance warnings in demo/Studio screens.
- The production build was attempted after releasing the active development server, but Next.js could not write its Webpack cache (`EPERM` on `.next/cache/webpack/*-production/*.pack_`). The development server was restarted and returned HTTP 200 for the live-store fixture.

Hosted verification remains the T3 acceptance in [the functional test plan](../functional-test-plan.md#t3-theme-publication--source-implementation-and-remaining-acceptance): publish through Studio, then confirm the separate guest storefront on the deployed API/schema and verify tenant access and public cache behavior.

# T2 tenant theme drafts

Date: 15 October 2026. Status: implemented and merged; production migration applied; API deployment and hosted acceptance unverified.

The user approved retaining the existing `/demo/studio` design for the real Studio and connecting its controls to the backend. The real editor previously stored only a browser draft. T2 now saves an independent restaurant theme draft; T3 owns publication and public storefront consumption.

## Decision

- Store allowlisted appearance in nullable `Tenants.ThemeDraftJson` (`jsonb`) and an independent integer `ThemeDraftVersion`, initially 1. A missing object resolves to the existing Lovable default. Conditional writes change only these columns and recheck active restaurant/organization and owner/manager membership in the update predicate.
- Preserve the demo's editable primary, accent, background and text roles, named presets and bundled fonts. Inter is already bundled and also available in the live selector. No arbitrary CSS, remote fonts, asset URLs, domain status or restaurant identity can be saved through this endpoint.
- Add Crisp Light (`#ffffff` / `#14201a`), Warm Cream (`#fff8ef` / `#2a1a12`) and Bistro Noir (`#111111` / `#f3efe6`, primary `#e8e2d4`) to the existing live preset grid. Manual colors mark ambiance custom. Retain the reference sliders: cards 0–24px, buttons 0–28px; 0 is sharp, 12 medium, 28 gives pill buttons. The user-approved demo controls supersede the historical Stitch recipe.
- Derive editable suggestions only from the authorized saved T1 logo. Decode normalized PNG with a pinned decoder; sample at most 64×64 pixels, skip transparent/neutral pixels and count deterministic color buckets. Missing/unusable logos or storage failure leave manual colors and named presets available. No URL or foreign private asset selector is accepted.
- Return real sRGB ratios for text/background, primary/background, text/accent and background/primary. `readyForPublication` means these supported normal-text pairs meet 4.5:1; it is not a full accessibility certification or publication operation. Low-contrast drafts can be saved to preserve editing. T3 must block unsafe publication and verify all rendered states and image overlays.
- Seed the editor from a server read; scope interactive Query keys to account, tenant and locale. First edit captures the version; background reads never rebase dirty drafts. Failed/stale saves preserve edits. Explicit Reload discards edits and fetches the authoritative draft. Denied reads/writes hide the editor. Pending writes lock controls and reject duplicate submissions.
- Keep T1 editing in the existing Brand media tab. Disable the demo-only inner Brand & details tab for connected Studio, so fictitious restaurant/domain fields cannot masquerade as persisted settings. Preview uses actual saved T1 images and restaurant name; sample menu/order data remain explicitly disclosed.

## Alternatives and consequences

Browser-only drafts cannot provide cross-device persistence or authorization. Publishing every save would silently combine T2 and T3; it is excluded. Drafts do not affect the public storefront, metadata, light-only admin shell or demo browser storage.

Migration `20261015171219_TenantThemeDraft` was applied to Coolify Production through Chrome after PR #110 merged; other database environments are outside this rollout. API deployment and hosted behavior remain unverified. EF regeneration exposed an older migration delegating its target model to the mutable snapshot. Its designer now contains the original committed target model, preserving migration history independently of new fields.

See [contracts](../../api/api-contracts.md#t2-theme-drafts--15-october-2026), [schema](../../database/database-schema.md#t2-theme-drafts--15-october-2026) and [verification](../../audits/theme-controls.md).

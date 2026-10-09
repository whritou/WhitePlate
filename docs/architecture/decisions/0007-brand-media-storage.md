# Tenant brand media storage

Date: 2026-10-08. Status: implementation decision for T1. The user selected private S3-compatible storage and instructed implementation of the proposed API-mediated preview/save flow.

## Scope and boundaries

T1 supplies reusable tenant-owned media storage and the Stitch Brand Identity Assets card: logo, favicon and hero banner. Palette, typography, custom domains, product photos and whole-theme publication remain separate cards. Saving an individual asset makes that slot public immediately; an upload alone does not publish it.

Application ports own media use cases; Infrastructure owns EF metadata, S3 and image decoding; the API owns HTTP. Membership is checked from persisted owner/manager permissions on every protected operation. The browser supplies resource selectors, never authorization. Protected previews and public delivery use API/BFF routes, never bucket URLs or presigned capabilities. Public delivery resolves an active tenant host and serves only the current active slot, with no shared cache.

## Files and lifecycle

Logo: PNG/JPEG/WebP, at most 2 MiB, at least 512 by 512 pixels; preserve the full image inside a transparent 512-square canvas. Favicon: PNG/ICO, at most 1 MiB, at least 64-square; normalize the largest ICO frame to 64-square PNG. Banner: PNG/JPEG/WebP, at most 4 MiB, at least 640 by 360; choose 16:9 or 21:9, center crop after orientation, preview the processed result, normalize to 1600 by 900 or 1680 by 720 WebP. Every input is capped at 4096 pixels per dimension and 16 megapixels. SVG, other formats and animated PNG/WebP are rejected. No browser filename is used as an object key. Metadata is stripped and decoder resource/concurrency limits apply.

Upload creates metadata before writing a generated tenant/id object key. Only successfully normalized and stored drafts can be saved. Expected-current-asset preconditions and a serializable transaction prevent silently replacing concurrent edits. Failed upload/save keeps the active asset. Pending objects expire after 24 hours; replaced/removed objects after seven days. A hosted cleanup worker deletes expired objects before metadata, retries failures and excludes active assets. Pending metadata also tracks object writes interrupted before completion.

S3 endpoint, signing region, bucket and server credentials are configured outside source. Missing storage returns unavailable without disabling unrelated API features. Bucket must be private with public access blocked; operators own provisioning, encryption, backup/version lifecycle and credential rotation. Direct browser presigned uploads were rejected because validation and immediate membership revocation would be harder. Local API-volume storage was rejected by the user's storage choice.

## UI and verification

The protected Theming Studio route retains the existing organization shell and tenant context. Upload progress, processed draft preview, explicit save/discard, confirmed remove, independent slot state, retry, offline and unavailable states are localized EN/FR. Drafts survive failed requests; duplicate mutations are disabled. Responsive tiles and the preview stack on narrow screens. Only T1 controls operate.

Tests cover image validation, processing, cross-tenant membership and revocation, persistence/preconditions, public draft denial and cleanup. Frontend tests cover parsers, shared binary transport and recoverable UI flows. Run API tests and frontend tests/lint/typecheck/format/build; record screenshot comparisons separately from actual S3/database/hosted acceptance. Migrations are generated, never applied automatically.

# Product photo galleries

Date: 2026-10-09. Status: source implementation decision for M5. The user approved the photo policies and explicitly required several images per product. Actual bucket/PostgreSQL/hosted acceptance remains separate.

## Scope and publication

M5 extends M1's product editor and T1's private S3-compatible storage. Each product has an ordered gallery of at most eight images. The first is the guest-card cover. Owners/managers can add, replace, remove, reorder and choose the cover, with processed previews and one explicit **Save photos** action. Uploads are private drafts. Metadata/product saves do not publish a photo draft. Gallery save publishes the ordered list immediately; M4 catalog-wide draft publication remains Backlog and is not implemented here.

The editor follows the supplied menu-builder photo panel and adds a thumbnail strip for the user's multiple-image requirement. Shared WhitePlate tokens, Base UI controls and existing organization navigation remain in use. The gallery and metadata stack when available container width is insufficient. Guest cards show the cover; the real product/options dialog shows the saved gallery in its scrollable body, preserving access to quantity and footer actions.

## Image policy

- Static JPEG, PNG and WebP, at most 4 MiB per input. SVG, ICO, other formats, animation, corrupt content and oversized decoded images are rejected using T1's signature-pinned decoder, resource limits and re-encoding.
- Maximum 4096 pixels per dimension and 16 megapixels. Minimum oriented dimensions: 320 × 320 for 1:1 or 320 × 240 for 4:3. The Stitch 1200px example is a recommendation, not a minimum.
- Auto-orient, center crop to the selected ratio, strip metadata and convert to sRGB WebP at quality 85. No manual focal-point editing: center is the consistent focal point. The processed result is the preview and saved image.
- Store 320, 640 and 1200-width variants, without upscaling. A variant may be narrower than its nominal name when the source is smaller. All three generated keys belong to one media record and are removed together by T1 cleanup.
- Product-adjacent photos are decorative (`alt=""`) because the product has its localized name and description. No separate image-description metadata is introduced. Missing/failed images have a localized semantic fallback; thumbnail selectors have numbered accessible names and selected state.
- Guest cards reserve a square box; the detail gallery reserves a square canvas across mixed ratios. `object-contain` preserves the server crop without distortion or additional clipping. Uploaded image loading does not change the reserved box size.

## Ownership, concurrency and retention

`MediaAssets.ProductId` is nullable: brand assets retain their three slots; product assets use slot `product`. A composite `(TenantId, ProductId)` foreign key references the same-tenant product key. `SortOrder` stores gallery order. Brand-active uniqueness applies only where `ProductId IS NULL`.

Every protected list, upload, preview and save checks persisted owner/manager membership and product ownership. Each candidate must belong to that exact tenant/product, be ready and unexpired, and be either currently active or a never-published draft. Brand media, foreign-product media and retired media cannot be attached. Archived products or archived categories reject mutations; authorized staff may still inspect retained photos. Public delivery resolves an active tenant host and requires a nonarchived product in a visible, nonarchived category and a current active photo. Browser tenant selectors are never authorization.

Save receives the ordered desired IDs and the ordered expected current IDs. A serializable EF transaction rechecks product/category archive state and the authoritative gallery, rejecting stale saves with 412; failed saves preserve the published gallery. Upload writes pending metadata before three generated object keys and marks ready only after all variants are stored. Failed/partial uploads remain discoverable by cleanup.

T1's limits and retention are reused: at most twenty never-published pending records per tenant; drafts expire after 24 hours, removed/replaced records after seven days. Archived products retain their current gallery for restore. Cleanup claims inactive expired records, deletes all variant objects before metadata, and retries failures. Active galleries never expire through that worker.

API/BFF delivery exposes no bucket keys, signed URLs or credentials. Protected responses use `private, no-store` and `Vary: Cookie`; public image responses use `no-store`, with host variation at the BFF. Images bypass Next's shared optimizer. Editor queries include account, tenant, locale and product; auth failures hide cached photo rendering. Unsaved gallery state is local and survives recoverable errors until discard/navigation. Pending mutations have a synchronous guard.

## Alternatives and rollout

A single photo was rejected by the user's explicit multi-image correction. Direct browser object uploads were rejected by T1's ownership/content-validation policy. Full-resolution originals and a separate crop editor add storage and lifecycle work beyond this scope; only normalized variants are retained.

Generate/review/apply `ProductPhotoGallery` after the existing T1 migrations and deploy API before frontend. No shared migration is applied automatically. Before downgrading this migration, clear published product galleries: the earlier tenant/slot unique index cannot represent several active product photos. Provider configuration, actual S3 wire operations, Linux native processing, PostgreSQL concurrency and hosted two-tenant acceptance remain required; local dictionary storage and browser fixtures do not prove them.

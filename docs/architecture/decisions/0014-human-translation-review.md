# Human translation review and glossary

Date: 17 October 2026. Status: implemented in source and applied to Coolify Production; API deployment and hosted acceptance pending.

## Context

Catalog translations are entered by restaurant staff. M3 adds review and terminology support without machine-generated text and without changing translations that already exist. M4 continues to own the publication boundary between staff drafts and guest-visible catalog content.

## Decision

- Do not provide AI, machine, or automatic translation. Staff enter every translation candidate themselves.
- Preserve existing saved translations as-is. The feature creates no review metadata or candidate for a legacy translation unless a person explicitly submits a changed translation.
- Store submitted candidate text separately from the catalog translation map. An unchanged submission is a no-op; a changed submission creates a versioned pending review, and a newer candidate supersedes an older pending one.
- Restrict submission, queue access, glossary management and decisions to persisted restaurant owners and managers. The candidate author cannot approve or reject their own candidate.
- Require the expected candidate version for a decision and mark a candidate stale when its source text or saved target translation has changed since submission. The reviewer must request a fresh human submission.
- Approval writes the candidate into the normalized catalog draft. M4 publication remains a separate owner/manager action before a guest can see the change. Rejection preserves the saved translation.
- Keep a tenant-owned glossary by source/target locale pair. Glossary matches are review warnings only; they never insert, replace or rewrite translation text.
- Add new empty workflow tables without backfilling or updating existing catalog translation rows. Migrations remain operator-applied and do not run at startup.

## Consequences and limits

Review is an explicit step for changed translations, while unaffected legacy translations continue to work without migration metadata. Candidate versioning and text fingerprints prevent review decisions from applying to changed source/draft text. Glossary wording remains advisory. The additive migration was applied to Coolify Production with both tables empty and `whiteplate_api` grants verified; no legacy translation data was changed. PostgreSQL application-level concurrency and hosted staff/guest acceptance remain open because the API has not been deployed. See [rollout evidence](../../audits/catalog-translation-workflow.md), the [API contract](../../api/api-contracts.md#m3-human-translation-review-and-glossary--2026-10-17), [schema](../../database/database-schema.md#m3-human-translation-review-and-glossary--2026-10-17), and [functional acceptance plan](../../functional-test-plan.md#m3-human-translation-review-and-glossary).

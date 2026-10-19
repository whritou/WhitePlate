# Studio / real customer comparison captures — 19 October 2026

These are controlled local captures, not a hosted acceptance declaration. Both sides use the same theme and catalog. Store viewport/region comparisons require zero pixel differences; development tooling is hidden. See [scope and remaining differences](../../storefront-studio-renderer-parity.md).

Final run: 23 browser scenarios passed; all 42 raw-pixel reports are zero. Neutral captures use the same pointer state and crop the viewport frame where possible. Hover captures below deliberately preserve the active hover.

## Shared hover feedback — 1024 × 900

| State | Studio renderer | Real controller |
| --- | --- | --- |
| Outline basket becomes filled | ![Studio basket hover](hover-studio-store.png) | ![Real basket hover](hover-live-store.png) |
| Product action hover | ![Studio product hover](hover-studio-modal.png) | ![Real product hover](hover-live-modal.png) |
| Basket close hover | ![Studio close hover](hover-studio-basket.png) | ![Real close hover](hover-live-basket.png) |

## Authoritative quote totals

These compare the shared total block before and after applying the same €2 discount with 10% tax. The real browser response is controlled here; API relational tests separately verify exact quote/created-receipt equality and absence of writes.

| Width/state | Studio renderer | Real controller |
| --- | --- | --- |
| 390 / initial | ![Studio total](quote-390-true-initial.png) | ![Real total](quote-390-false-initial.png) |
| 390 / discount | ![Studio discount](quote-390-true-discount.png) | ![Real discount](quote-390-false-discount.png) |
| 1024 / initial | ![Studio total](quote-1024-true-initial.png) | ![Real total](quote-1024-false-initial.png) |
| 1024 / discount | ![Studio discount](quote-1024-true-discount.png) | ![Real discount](quote-1024-false-discount.png) |

## Store — 390 × 900

| State | Studio renderer | Real controller |
| --- | --- | --- |
| card | ![Studio card](390-studio-card-viewport.png) | ![Real card](390-live-card-viewport.png) |
| modal | ![Studio modal](390-studio-modal-viewport.png) | ![Real modal](390-live-modal-viewport.png) |
| floating | ![Studio floating](390-studio-floating-viewport.png) | ![Real floating](390-live-floating-viewport.png) |
| basket | ![Studio basket](390-studio-basket-viewport.png) | ![Real basket](390-live-basket-viewport.png) |
| basket-variants | ![Studio basket-variants](390-studio-basket-variants-viewport.png) | ![Real basket-variants](390-live-basket-variants-viewport.png) |

## checkout — 390px

Whole-page captures show the actual copy/state differences listed in the audit. The comparison assertions cover the documented shared regions.

| Studio renderer | Real controller |
| --- | --- |
| ![Studio checkout](checkout-390-studio.png) | ![Real checkout](checkout-390-live.png) |

## confirmation — 390px

Whole-page captures show the actual copy/state differences listed in the audit. The comparison assertions cover the documented shared regions.

| Studio renderer | Real controller |
| --- | --- |
| ![Studio confirmation](confirmation-390-studio.png) | ![Real confirmation](confirmation-390-live.png) |

## tracking — 390px

Whole-page captures show the actual copy/state differences listed in the audit. The comparison assertions cover the documented shared regions.

| Studio renderer | Real controller |
| --- | --- |
| ![Studio tracking](tracking-390-studio.png) | ![Real tracking](tracking-390-live.png) |

Network uncertainty: [capture](checkout-390-uncertain.png). Tracking: [Pending](tracking-390-Pending.png), [Ready](tracking-390-Ready.png), [Completed](tracking-390-Completed.png), [Cancelled](tracking-390-Cancelled.png).

## Store — 1024 × 900

| State | Studio renderer | Real controller |
| --- | --- | --- |
| card | ![Studio card](1024-studio-card-viewport.png) | ![Real card](1024-live-card-viewport.png) |
| modal | ![Studio modal](1024-studio-modal-viewport.png) | ![Real modal](1024-live-modal-viewport.png) |
| floating | ![Studio floating](1024-studio-floating-viewport.png) | ![Real floating](1024-live-floating-viewport.png) |
| basket | ![Studio basket](1024-studio-basket-viewport.png) | ![Real basket](1024-live-basket-viewport.png) |
| basket-variants | ![Studio basket-variants](1024-studio-basket-variants-viewport.png) | ![Real basket-variants](1024-live-basket-variants-viewport.png) |

## checkout — 1024px

Whole-page captures show the actual copy/state differences listed in the audit. The comparison assertions cover the documented shared regions.

| Studio renderer | Real controller |
| --- | --- |
| ![Studio checkout](checkout-1024-studio.png) | ![Real checkout](checkout-1024-live.png) |

## confirmation — 1024px

Whole-page captures show the actual copy/state differences listed in the audit. The comparison assertions cover the documented shared regions.

| Studio renderer | Real controller |
| --- | --- |
| ![Studio confirmation](confirmation-1024-studio.png) | ![Real confirmation](confirmation-1024-live.png) |

## tracking — 1024px

Whole-page captures show the actual copy/state differences listed in the audit. The comparison assertions cover the documented shared regions.

| Studio renderer | Real controller |
| --- | --- |
| ![Studio tracking](tracking-1024-studio.png) | ![Real tracking](tracking-1024-live.png) |

Network uncertainty: [capture](checkout-1024-uncertain.png). Tracking: [Pending](tracking-1024-Pending.png), [Ready](tracking-1024-Ready.png), [Completed](tracking-1024-Completed.png), [Cancelled](tracking-1024-Cancelled.png).

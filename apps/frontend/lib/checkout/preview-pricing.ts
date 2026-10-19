import type { PreviewPriceLine } from "@/types/checkout"

export function previewPricing(
  lines: PreviewPriceLine[],
  discountAmount: number
) {
  const subtotals = lines.map((line) => Math.round(line.unit * 100) * line.qty)
  const subtotal = subtotals.reduce((sum, amount) => sum + amount, 0)
  const discount = Math.min(subtotal, Math.round(discountAmount * 100))
  let remaining = discount
  const taxAmount = lines.reduce((sum, line, index) => {
    const allocation =
      index === lines.length - 1
        ? remaining
        : Math.min(
            remaining,
            subtotal === 0
              ? 0
              : Math.floor((discount * subtotals[index]) / subtotal + 0.5)
          )

    remaining -= allocation

    return (
      sum +
      Math.floor(
        ((subtotals[index] - allocation) *
          Math.round((line.product.tax ?? 0) * 100)) /
          10_000 +
          0.5
      )
    )
  }, 0)

  return {
    subtotal: subtotal / 100,
    discount: discount / 100,
    taxAmount: taxAmount / 100,
    total: (subtotal - discount + taxAmount) / 100,
  }
}

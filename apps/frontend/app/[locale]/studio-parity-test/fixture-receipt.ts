import {
  customerCart,
  customerMenu,
} from "@/lib/checkout/customer-presentation"
import type { StorefrontMenu } from "@/types/storefront"
import type { OrderReceipt } from "@/types/checkout"

export function fixtureReceipt(menu: StorefrontMenu): OrderReceipt {
  const cart = customerCart(
    customerMenu(menu),
    menu.categories[0].products.map((product, index) => ({
      productId: product.id,
      quantity: 1,
      optionIds: index === 0 ? ["66666666-6666-4666-8666-666666666666"] : [],
    })),
    "",
    menu.locale
  )

  return {
    id: "55555555-5555-4555-8555-555555555555",
    tenantId: menu.tenantId,
    currency: "EUR",
    customerName: "Alex Martin",
    menuLocale: menu.locale,
    discountCode: null,
    subtotal: 19,
    discountAmount: 0,
    taxAmount: 0,
    total: 19,
    status: "Pending",
    version: 1,
    createdAt: "2026-10-18T10:00:00Z",
    pickupAt: "2026-10-18T10:30:00Z",
    pickupTimeZone: "Europe/Paris",
    lines: cart.lines.map((line) => ({
      productId: line.product.id,
      productName: line.product.n,
      baseUnitPrice: line.product.p,
      taxRatePercent: 0,
      quantity: line.qty,
      subtotal: line.unit * line.qty,
      discountAmount: 0,
      taxAmount: 0,
      total: line.unit * line.qty,
      options: line.picks.map((name) => ({
        optionId: "66666666-6666-4666-8666-666666666666",
        name,
        priceAdjustment: 1,
      })),
    })),
  }
}

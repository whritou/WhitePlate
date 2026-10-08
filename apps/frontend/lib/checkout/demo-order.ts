import type {
  DemoCartItem,
  DemoPricedProduct,
  DemoReceipt,
  DemoTotals,
} from "@/types/demo"

export function calculateDemoOrder(
  products: DemoPricedProduct[],
  cart: DemoCartItem[],
  code: string
): DemoTotals {
  const subtotalCents = cart.reduce((sum, item) => {
    const product = products.find(
      (candidate) => candidate.id === item.productId
    )

    if (
      !product ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 99
    ) {
      throw new Error("Invalid illustrative cart")
    }

    return sum + Math.round(product.basePrice * 100) * item.quantity
  }, 0)
  const discountCents =
    code.trim().toUpperCase() === "DIRECT10"
      ? Math.round(subtotalCents * 0.1)
      : 0
  const taxCents = Math.round((subtotalCents - discountCents) * 0.08)

  return {
    subtotal: subtotalCents / 100,
    discount: discountCents / 100,
    tax: taxCents / 100,
    total: (subtotalCents - discountCents + taxCents) / 100,
  }
}

export function createDemoReceipt(
  products: DemoPricedProduct[],
  cart: DemoCartItem[],
  code: string,
  name: string
): DemoReceipt {
  if (!cart.length || !name.trim())
    throw new Error("An order and customer name are required")

  return {
    ...calculateDemoOrder(products, cart, code),
    customerName: name.trim(),
    items: cart.map((item) => ({ ...item })),
  }
}

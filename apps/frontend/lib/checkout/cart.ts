export type CartItem = {
  productId: string
  quantity: number
  optionIds: string[]
}
export type OrderInput = {
  customerName: string
  discountCode: string | null
  items: CartItem[]
}
export type CheckoutAttempt = { key: string; input: OrderInput }
type SelectableProduct = {
  isAvailable: boolean
  optionGroups: {
    minimumSelections: number
    maximumSelections: number
    options: { id: string }[]
  }[]
}

export function validProductSelection(
  product: SelectableProduct,
  optionIds: string[]
): boolean {
  if (
    !product.isAvailable ||
    optionIds.length > 20 ||
    new Set(optionIds).size !== optionIds.length
  )
    return false
  const knownOptions = new Set(
    product.optionGroups.flatMap((group) =>
      group.options.map((option) => option.id)
    )
  )
  return (
    optionIds.every((id) => knownOptions.has(id)) &&
    product.optionGroups.every((group) => {
      const count = group.options.filter((option) =>
        optionIds.includes(option.id)
      ).length
      return (
        count >= group.minimumSelections && count <= group.maximumSelections
      )
    })
  )
}

export function updateCart(items: CartItem[], item: CartItem): CartItem[] {
  const others = items.filter((line) => line.productId !== item.productId)
  return item.quantity === 0
    ? others
    : [...others, { ...item, optionIds: [...item.optionIds] }]
}

export function prepareCheckout(
  input: OrderInput,
  previous: CheckoutAttempt | null,
  createKey: () => string
): CheckoutAttempt {
  const normalized = {
    customerName: input.customerName.trim(),
    discountCode: input.discountCode?.trim().toUpperCase() || null,
    items: input.items
      .map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        optionIds: [...item.optionIds].sort(),
      }))
      .sort((a, b) => a.productId.localeCompare(b.productId)),
  }
  return previous &&
    JSON.stringify(previous.input) === JSON.stringify(normalized)
    ? previous
    : { key: createKey(), input: normalized }
}

export function validateOrderInput(input: unknown): input is OrderInput {
  if (!input || typeof input !== "object") return false
  const value = input as Record<string, unknown>
  if (
    typeof value.customerName !== "string" ||
    !value.customerName.trim() ||
    value.customerName.trim().length > 200 ||
    (value.discountCode !== null &&
      (typeof value.discountCode !== "string" ||
        value.discountCode.length > 64)) ||
    !Array.isArray(value.items) ||
    value.items.length < 1 ||
    value.items.length > 50
  )
    return false
  const productIds = new Set<string>()
  return value.items.every((item: unknown) => {
    if (!item || typeof item !== "object") return false
    const line = item as Record<string, unknown>
    if (
      !isUuid(line.productId) ||
      productIds.has(line.productId) ||
      !Number.isInteger(line.quantity) ||
      Number(line.quantity) < 1 ||
      Number(line.quantity) > 99 ||
      !Array.isArray(line.optionIds) ||
      line.optionIds.length > 20 ||
      !line.optionIds.every(isUuid) ||
      new Set(line.optionIds).size !== line.optionIds.length
    )
      return false
    productIds.add(line.productId)
    return true
  })
}

export function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value) &&
    value !== "00000000-0000-0000-0000-000000000000"
  )
}

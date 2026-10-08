import type {
  CartItem,
  OrderInput,
  CheckoutAttempt,
  SelectableProduct,
} from "@/types/checkout"

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

export function createTrackingToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  let binary = ""

  for (const byte of bytes) binary += String.fromCharCode(byte)

  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")
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
  createKey: () => string,
  createTrackingToken?: () => string
): CheckoutAttempt {
  const normalized = {
    customerName: input.customerName.trim(),
    discountCode: input.discountCode?.trim().toUpperCase() || null,
    menuLocale: input.menuLocale,
    items: input.items
      .map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        optionIds: [...item.optionIds].sort(),
      }))
      .sort((a, b) => a.productId.localeCompare(b.productId)),
  }
  const previousInput = previous
    ? {
        customerName: previous.input.customerName,
        discountCode: previous.input.discountCode,
        menuLocale: previous.input.menuLocale,
        items: previous.input.items,
      }
    : null

  if (previous && JSON.stringify(previousInput) === JSON.stringify(normalized))
    return previous

  const trackingToken = input.trackingToken ?? createTrackingToken?.()

  return {
    key: createKey(),
    input: {
      ...normalized,
      ...(trackingToken ? { trackingToken } : {}),
    },
  }
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
    typeof value.menuLocale !== "string" ||
    value.menuLocale.length > 128 ||
    (value.trackingToken !== undefined &&
      (typeof value.trackingToken !== "string" ||
        !/^[A-Za-z0-9_-]{43}$/.test(value.trackingToken))) ||
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

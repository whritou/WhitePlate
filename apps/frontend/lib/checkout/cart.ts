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

export function cartItemKey(
  item: Pick<CartItem, "productId" | "optionIds">
): string {
  return `${item.productId}|${[...item.optionIds].sort().join(",")}`
}

export function updateCart(items: CartItem[], item: CartItem): CartItem[] {
  const key = cartItemKey(item)

  if (item.quantity === 0)
    return items.filter((line) => cartItemKey(line) !== key)

  const next = { ...item, optionIds: [...item.optionIds] }

  return items.some((line) => cartItemKey(line) === key)
    ? items.map((line) => (cartItemKey(line) === key ? next : line))
    : [...items, next]
}

export function prepareCheckout(
  input: OrderInput,
  previous: CheckoutAttempt | null,
  createKey: () => string,
  createTrackingToken?: () => string
): CheckoutAttempt {
  const normalized = {
    customerName: input.customerName.trim(),
    ...(input.customerPhone?.trim()
      ? { customerPhone: input.customerPhone.trim() }
      : {}),
    ...(input.orderNotes?.trim()
      ? { orderNotes: input.orderNotes.trim() }
      : {}),
    customerEmail:
      input.emailUpdatesConsented || input.analyticsConsented
        ? input.customerEmail.trim()
        : "",
    emailUpdatesConsented: input.emailUpdatesConsented,
    ...(input.analyticsConsented
      ? {
          analyticsConsented: true,
          analyticsSource: input.analyticsSource ?? "web",
        }
      : {}),
    discountCode: input.discountCode?.trim().toUpperCase() || null,
    menuLocale: input.menuLocale,
    ...(input.pickupAt ? { pickupAt: input.pickupAt } : {}),
    items: input.items
      .map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        optionIds: [...item.optionIds].sort(),
      }))
      .sort((a, b) => cartItemKey(a).localeCompare(cartItemKey(b))),
  }
  const previousInput = previous
    ? {
        customerName: previous.input.customerName,
        ...(previous.input.customerPhone
          ? { customerPhone: previous.input.customerPhone }
          : {}),
        ...(previous.input.orderNotes
          ? { orderNotes: previous.input.orderNotes }
          : {}),
        customerEmail: previous.input.customerEmail,
        emailUpdatesConsented: previous.input.emailUpdatesConsented,
        ...(previous.input.analyticsConsented
          ? {
              analyticsConsented: true,
              analyticsSource: previous.input.analyticsSource ?? "web",
            }
          : {}),
        discountCode: previous.input.discountCode,
        menuLocale: previous.input.menuLocale,
        ...(previous.input.pickupAt
          ? { pickupAt: previous.input.pickupAt }
          : {}),
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
    value.customerName.trim().length > 160 ||
    (value.customerPhone !== undefined &&
      (typeof value.customerPhone !== "string" ||
        (value.customerPhone.trim() !== "" &&
          (!/^[0-9+(). -]{1,40}$/.test(value.customerPhone.trim()) ||
            (value.customerPhone.match(/[0-9]/g)?.length ?? 0) < 3 ||
            (value.customerPhone.match(/[0-9]/g)?.length ?? 0) > 20)))) ||
    (value.orderNotes !== undefined &&
      (typeof value.orderNotes !== "string" ||
        value.orderNotes.trim().length > 500)) ||
    typeof value.customerEmail !== "string" ||
    value.customerEmail.length > 254 ||
    typeof value.emailUpdatesConsented !== "boolean" ||
    (value.analyticsConsented !== undefined &&
      typeof value.analyticsConsented !== "boolean") ||
    (value.analyticsSource !== undefined &&
      !["web", "qr"].includes(String(value.analyticsSource))) ||
    ((value.emailUpdatesConsented || value.analyticsConsented) &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.customerEmail.trim())) ||
    (!value.emailUpdatesConsented &&
      !value.analyticsConsented &&
      value.customerEmail.length > 0) ||
    (value.discountCode !== null &&
      (typeof value.discountCode !== "string" ||
        value.discountCode.length > 64)) ||
    typeof value.menuLocale !== "string" ||
    value.menuLocale.length > 128 ||
    (value.trackingToken !== undefined &&
      (typeof value.trackingToken !== "string" ||
        !/^[A-Za-z0-9_-]{43}$/.test(value.trackingToken))) ||
    (value.pickupAt !== undefined &&
      value.pickupAt !== null &&
      (typeof value.pickupAt !== "string" ||
        !Number.isFinite(Date.parse(value.pickupAt)))) ||
    !Array.isArray(value.items) ||
    value.items.length < 1 ||
    value.items.length > 50
  )
    return false

  const variants = new Set<string>()

  return value.items.every((item: unknown) => {
    if (!item || typeof item !== "object") return false

    const line = item as Record<string, unknown>

    if (
      !isUuid(line.productId) ||
      !Number.isInteger(line.quantity) ||
      Number(line.quantity) < 1 ||
      Number(line.quantity) > 99 ||
      !Array.isArray(line.optionIds) ||
      line.optionIds.length > 20 ||
      !line.optionIds.every(isUuid) ||
      new Set(line.optionIds).size !== line.optionIds.length
    )
      return false

    const key = cartItemKey(line as CartItem)

    if (variants.has(key)) return false
    variants.add(key)

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

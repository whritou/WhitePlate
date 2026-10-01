import { createApiRequestFactory, type ApiError } from "../api/request-factory"
import { getTenantApiBaseUrl, getTenantSlug } from "../api/tenant-routing"
import { isUuid, prepareCheckout, validateOrderInput } from "./cart"

export type OrderReceipt = {
  id: string
  tenantId: string
  currency: string
  customerName: string
  discountCode: string | null
  subtotal: number
  discountAmount: number
  taxAmount: number
  total: number
  status: string
  version: number
  createdAt: string
  lines: {
    productId: string
    productName: string
    baseUnitPrice: number
    taxRatePercent: number
    quantity: number
    subtotal: number
    discountAmount: number
    taxAmount: number
    total: number
    options: { optionId: string; name: string; priceAdjustment: number }[]
  }[]
}
export type CheckoutResult =
  { ok: true; receipt: OrderReceipt } | { ok: false; error: ApiError }
export type CheckoutConfiguration = {
  baseDomain: string | undefined
  apiTemplate: string | undefined
}

export async function submitGuestOrder(
  host: string | null,
  configuration: CheckoutConfiguration,
  input: unknown,
  key: unknown,
  fetcher: typeof fetch = fetch
): Promise<CheckoutResult> {
  const slug = getTenantSlug(host, configuration.baseDomain)
  if (!slug) return { ok: false, error: "not_found" }
  if (
    !validateOrderInput(input) ||
    typeof key !== "string" ||
    !/^[A-Za-z0-9._:-]{8,128}$/.test(key)
  ) {
    return { ok: false, error: "invalid" }
  }
  const payload = prepareCheckout(input, null, () => key).input
  if (new TextEncoder().encode(JSON.stringify(payload)).length > 16 * 1024)
    return { ok: false, error: "invalid" }
  const baseUrl = getTenantApiBaseUrl(
    slug,
    configuration.apiTemplate,
    configuration.baseDomain
  )
  if (!baseUrl) return { ok: false, error: "unavailable" }
  const api = createApiRequestFactory({
    baseUrl,
    public: true,
    getToken: async () => null,
    fetcher,
  })
  const result = await api.post<unknown>("/api/v1/orders", payload, {
    idempotencyKey: key,
    signal: AbortSignal.timeout(15_000),
  })
  if (!result.ok) return { ok: false, error: result.error }
  return isOrderReceipt(result.data)
    ? { ok: true, receipt: result.data }
    : { ok: false, error: "unavailable" }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function isAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
}

function isOrderReceipt(value: unknown): value is OrderReceipt {
  if (
    !isRecord(value) ||
    !isUuid(value.id) ||
    !isUuid(value.tenantId) ||
    !["EUR", "USD", "GBP"].includes(String(value.currency)) ||
    typeof value.customerName !== "string" ||
    (value.discountCode !== null && typeof value.discountCode !== "string") ||
    !["Pending", "Preparing", "Ready", "Completed", "Cancelled"].includes(
      String(value.status)
    ) ||
    !Number.isInteger(value.version) ||
    Number(value.version) < 1 ||
    typeof value.createdAt !== "string" ||
    !Number.isFinite(Date.parse(value.createdAt)) ||
    ![value.subtotal, value.discountAmount, value.taxAmount, value.total].every(
      isAmount
    ) ||
    !Array.isArray(value.lines) ||
    value.lines.length < 1 ||
    value.lines.length > 50
  )
    return false
  return value.lines.every(
    (line: unknown) =>
      isRecord(line) &&
      isUuid(line.productId) &&
      typeof line.productName === "string" &&
      Number.isInteger(line.quantity) &&
      Number(line.quantity) >= 1 &&
      Number(line.quantity) <= 99 &&
      [
        line.baseUnitPrice,
        line.taxRatePercent,
        line.subtotal,
        line.discountAmount,
        line.taxAmount,
        line.total,
      ].every(isAmount) &&
      Array.isArray(line.options) &&
      line.options.length <= 20 &&
      line.options.every(
        (option: unknown) =>
          isRecord(option) &&
          isUuid(option.optionId) &&
          typeof option.name === "string" &&
          isAmount(option.priceAdjustment)
      )
  )
}

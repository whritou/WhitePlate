import "server-only"
import { createApiRequestFactory } from "@/lib/api/request-factory"
import { createPublicStorefrontApiTarget } from "@/lib/storefront-preview-routing"
import { validateOrderInput } from "@/lib/checkout/cart"
import { parsePublicOrderSummary } from "@/lib/validation/public-order-summary"
import type { OrderQuoteInput } from "@/types/checkout"

export async function getOrderQuote(
  host: string | null,
  input: OrderQuoteInput,
  signal: AbortSignal,
  restaurantSlug?: string
) {
  if (
    !validateOrderInput({
      ...input,
      customerName: "Quote",
      customerEmail: "",
      emailUpdatesConsented: false,
    })
  )
    return { ok: false as const, status: 400, error: "invalid" as const }

  const target = createPublicStorefrontApiTarget(host, restaurantSlug, {
    baseDomain: process.env.STOREFRONT_BASE_DOMAIN,
    apiTemplate: process.env.PUBLIC_TENANT_API_URL_TEMPLATE,
    pathBaseDomain: process.env.STOREFRONT_PATH_BASE_DOMAIN,
    centralApiUrl: process.env.API_BASE_URL,
  })

  if (!target?.apiBaseUrl)
    return { ok: false as const, status: 404, error: "not_found" as const }

  const api = createApiRequestFactory({
    baseUrl: target.apiBaseUrl,
    getToken: async () => null,
    public: true,
  })
  const response = await api.post<unknown>(
    `${target.apiPrefix}/orders/quote`,
    {
      menuLocale: input.menuLocale,
      discountCode: input.discountCode,
      items: input.items.map(({ productId, quantity, optionIds }) => ({
        productId,
        quantity,
        optionIds,
      })),
    },
    { signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]) }
  )

  if (!response.ok) return response

  const data = parsePublicOrderSummary(response.data)

  return data
    ? { ok: true as const, status: 200, data }
    : { ok: false as const, status: 502, error: "unavailable" as const }
}

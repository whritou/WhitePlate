"use client"

import { useQuery } from "@tanstack/react-query"
import { browserRequest } from "@/lib/api/browser-request"
import { appendRestaurantSlugQuery } from "@/lib/storefront-preview-routing"
import { parsePublicOrderSummary } from "@/lib/validation/public-order-summary"
import type { OrderQuoteInput } from "@/types/checkout"

export function useOrderQuote(
  tenantId: string,
  input: OrderQuoteInput,
  enabled: boolean,
  restaurantSlug?: string
) {
  return useQuery({
    queryKey: ["order-quote", tenantId, restaurantSlug, input],
    enabled: enabled && input.items.length > 0,
    retry: false,
    staleTime: 0,
    queryFn: async ({ signal }) => {
      const response = await browserRequest(
        appendRestaurantSlugQuery("/api/public/order-quote", restaurantSlug),
        {
          method: "POST",
          body: input,
          signal,
        }
      )

      if (!response.ok) throw new Error(response.error)

      const data = parsePublicOrderSummary(response.data)

      if (!data) throw new Error("unavailable")

      return data
    },
  })
}

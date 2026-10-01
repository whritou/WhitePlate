"use server"

import { headers } from "next/headers"
import { submitGuestOrder } from "@/lib/checkout/order-client"
import type { CheckoutResult } from "@/types/checkout"

export async function checkoutGuestOrder(
  input: unknown,
  key: unknown
): Promise<CheckoutResult> {
  const requestHeaders = await headers()
  const host = requestHeaders.get("host")
  const origin = requestHeaders.get("origin")
  try {
    const originUrl = origin ? new URL(origin) : null
    if (
      !originUrl ||
      !["http:", "https:"].includes(originUrl.protocol) ||
      originUrl.host !== host ||
      originUrl.origin !== origin
    )
      return { ok: false, error: "forbidden" }
  } catch {
    return { ok: false, error: "forbidden" }
  }
  return submitGuestOrder(
    host,
    {
      baseDomain: process.env.STOREFRONT_BASE_DOMAIN,
      apiTemplate: process.env.PUBLIC_TENANT_API_URL_TEMPLATE,
    },
    input,
    key
  )
}

"use server"

import { isUuid } from "@/lib/validation/common"
import {
  getStripeConnectStatus,
  startStripeConnectOAuth,
} from "@/services/stripe-connect"

export async function getStripeConnectStatusAction(input: unknown) {
  if (!input || typeof input !== "object")
    return {
      ok: false as const,
      status: 400 as const,
      error: "invalid" as const,
    }

  const value = input as Record<string, unknown>

  if (!isUuid(value.tenantId))
    return {
      ok: false as const,
      status: 400 as const,
      error: "invalid" as const,
    }

  return getStripeConnectStatus(value.tenantId)
}

export async function startStripeConnectOAuthAction(input: unknown) {
  if (!input || typeof input !== "object")
    return {
      ok: false as const,
      status: 400 as const,
      error: "invalid" as const,
    }

  const value = input as Record<string, unknown>

  if (
    !isUuid(value.tenantId) ||
    (value.locale !== "en" && value.locale !== "fr")
  )
    return {
      ok: false as const,
      status: 400 as const,
      error: "invalid" as const,
    }

  return startStripeConnectOAuth({
    tenantId: value.tenantId,
    locale: value.locale,
  })
}

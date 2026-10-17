"use server"

import { saveOrderEmailSettings } from "@/services/order-email-settings"
import { parseOrderEmailTemplates } from "@/lib/validation/order-email-settings"

export async function saveOrderEmailSettingsAction(input: unknown) {
  if (input === null || typeof input !== "object")
    return {
      ok: false as const,
      status: 400 as const,
      error: "invalid" as const,
    }

  const value = input as Record<string, unknown>
  const templates = parseOrderEmailTemplates(value.templates)

  if (
    typeof value.tenantId !== "string" ||
    !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value.tenantId) ||
    !Number.isSafeInteger(value.version) ||
    Number(value.version) < 1 ||
    !templates
  )
    return {
      ok: false as const,
      status: 400 as const,
      error: "invalid" as const,
    }

  return saveOrderEmailSettings({
    tenantId: value.tenantId,
    version: Number(value.version),
    templates,
  })
}

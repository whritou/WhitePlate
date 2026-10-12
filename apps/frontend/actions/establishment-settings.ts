"use server"

import {
  parseEstablishmentInput,
  parseOpeningHours,
  parsePickupSchedulingSettings,
} from "@/lib/validation/establishment-settings"
import {
  updateEstablishmentSettings,
  updateOpeningHours,
  updatePickupScheduling,
  updateTenantLegalProfile,
} from "@/services/establishment-settings"
import type { ApiResult } from "@/types/api"
import type { EstablishmentSettings } from "@/types/establishment-settings"

export async function saveOpeningHoursAction(
  input: unknown
): Promise<ApiResult<EstablishmentSettings>> {
  if (!input || typeof input !== "object")
    return { ok: false, status: 400, error: "invalid" }

  const value = input as Record<string, unknown>
  const schedule = parseOpeningHours(value.openingHours)

  if (
    typeof value.tenantId !== "string" ||
    !Number.isSafeInteger(value.establishmentVersion) ||
    schedule === undefined
  )
    return { ok: false, status: 400, error: "invalid" }

  return updateOpeningHours(
    value.tenantId,
    value.establishmentVersion as number,
    schedule
  )
}

export async function savePickupSchedulingAction(input: unknown): Promise<ApiResult<EstablishmentSettings>> {
  if (!input || typeof input !== "object") return { ok: false, status: 400, error: "invalid" }

  const value = input as Record<string, unknown>
  const pickupScheduling = parsePickupSchedulingSettings(value.pickupScheduling)

  if (typeof value.tenantId !== "string" || !/^[0-9a-f-]{36}$/i.test(value.tenantId) ||
      !Number.isSafeInteger(value.establishmentVersion) || !pickupScheduling)
    return { ok: false, status: 400, error: "invalid" }

  return updatePickupScheduling(value.tenantId, value.establishmentVersion as number, pickupScheduling)
}

export async function saveEstablishmentSettingsAction(
  input: unknown
): Promise<ApiResult<EstablishmentSettings>> {
  const value = parseEstablishmentInput(input)

  return value
    ? updateEstablishmentSettings(value)
    : { ok: false, status: 400, error: "invalid" }
}

export async function saveTenantLegalProfileAction(input: unknown) {
  if (!input || typeof input !== "object")
    return {
      ok: false as const,
      status: 400 as const,
      error: "invalid" as const,
    }

  const value = input as Record<string, unknown>

  if (
    typeof value.tenantId !== "string" ||
    !/^[0-9a-f-]{36}$/i.test(value.tenantId) ||
    !Number.isSafeInteger(value.version) ||
    (value.mode !== "inherit" && value.mode !== "custom") ||
    (value.mode === "custom" &&
      (typeof value.countryCode !== "string" ||
        !["FR", "DE", "GB", "US"].includes(value.countryCode))) ||
    [value.name, value.registrationNumber, value.taxIdentifier].some(
      (item) => item !== null && (typeof item !== "string" || item.length > 200)
    )
  )
    return {
      ok: false as const,
      status: 400 as const,
      error: "invalid" as const,
    }

  return updateTenantLegalProfile({
    tenantId: value.tenantId,
    version: value.version as number,
    mode: value.mode,
    countryCode: value.mode === "custom" ? (value.countryCode as string) : null,
    name: typeof value.name === "string" ? value.name : null,
    registrationNumber:
      typeof value.registrationNumber === "string"
        ? value.registrationNumber
        : null,
    taxIdentifier:
      typeof value.taxIdentifier === "string" ? value.taxIdentifier : null,
  })
}

"use server"

import {
  parseEstablishmentInput,
  parseOpeningHours,
} from "@/lib/validation/establishment-settings"
import {
  updateEstablishmentSettings,
  updateOpeningHours,
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

export async function saveEstablishmentSettingsAction(
  input: unknown
): Promise<ApiResult<EstablishmentSettings>> {
  const value = parseEstablishmentInput(input)

  return value
    ? updateEstablishmentSettings(value)
    : { ok: false, status: 400, error: "invalid" }
}

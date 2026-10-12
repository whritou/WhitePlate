"use server"

import { parseEstablishmentInput } from "@/lib/validation/establishment-settings"
import { updateEstablishmentSettings } from "@/services/establishment-settings"
import type { ApiResult } from "@/types/api"
import type { EstablishmentSettings } from "@/types/establishment-settings"

export async function saveEstablishmentSettingsAction(
  input: unknown
): Promise<ApiResult<EstablishmentSettings>> {
  const value = parseEstablishmentInput(input)

  return value
    ? updateEstablishmentSettings(value)
    : { ok: false, status: 400, error: "invalid" }
}

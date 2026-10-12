import "server-only"
import { whitePlateApi } from "@/lib/api"
import {
  parseEstablishmentOptions,
  parseEstablishmentSettings,
} from "@/lib/validation/establishment-settings"
import type { ApiResult } from "@/types/api"
import type {
  EstablishmentInput,
  EstablishmentRead,
  EstablishmentSettings,
  OpeningHoursSchedule,
  TenantLegalProfile,
} from "@/types/establishment-settings"
import { parseTenantLegalProfile } from "@/lib/validation/legal-profile"

export async function getEstablishmentSettings(
  tenantId: string,
  signal?: AbortSignal
): Promise<ApiResult<EstablishmentRead>> {
  const path = `/api/v1/tenants/${tenantId}/establishment-settings`
  const requestSignal = signal
    ? AbortSignal.any([signal, AbortSignal.timeout(10_000)])
    : AbortSignal.timeout(10_000)
  const [settings, options] = await Promise.all([
    whitePlateApi.get(path, { signal: requestSignal }),
    whitePlateApi.get(`${path}/options`, { signal: requestSignal }),
  ])

  if (!settings.ok) return settings
  if (!options.ok) return options

  const parsedSettings = parseEstablishmentSettings(settings.data)
  const parsedOptions = parseEstablishmentOptions(options.data)

  return parsedSettings && parsedOptions
    ? {
        ok: true,
        status: 200,
        data: { settings: parsedSettings, options: parsedOptions },
      }
    : { ok: false, status: 502, error: "unavailable" }
}

export async function getTenantLegalProfile(
  tenantId: string
): Promise<ApiResult<TenantLegalProfile>> {
  const response = await whitePlateApi.get<unknown>(
    `/api/v1/tenants/${tenantId}/establishment-settings/legal-profile`,
    { signal: AbortSignal.timeout(10_000) }
  )

  if (!response.ok) return response

  const data = parseTenantLegalProfile(response.data)

  return data
    ? { ok: true, status: 200, data }
    : { ok: false, status: 502, error: "unavailable" }
}

export async function updateTenantLegalProfile(input: {
  tenantId: string
  version: number
  mode: "inherit" | "custom"
  countryCode: string | null
  name: string | null
  registrationNumber: string | null
  taxIdentifier: string | null
}): Promise<ApiResult<TenantLegalProfile>> {
  const response = await whitePlateApi.put<unknown>(
    `/api/v1/tenants/${input.tenantId}/establishment-settings/legal-profile`,
    {
      mode: input.mode,
      legalCountryCode: input.countryCode,
      legalName: input.name,
      legalRegistrationNumber: input.registrationNumber,
      taxIdentifier: input.taxIdentifier,
    },
    { ifMatch: `"${input.version}"` }
  )

  if (!response.ok) return response

  const data = parseTenantLegalProfile(response.data)

  return data
    ? { ok: true, status: 200, data }
    : { ok: false, status: 502, error: "unavailable" }
}

export async function updateEstablishmentSettings(
  input: EstablishmentInput
): Promise<ApiResult<EstablishmentSettings>> {
  const { tenantId, establishmentVersion, ...body } = input
  const response = await whitePlateApi.put(
    `/api/v1/tenants/${tenantId}/establishment-settings`,
    body,
    { ifMatch: `"${establishmentVersion}"` }
  )

  if (!response.ok) return response

  const data = parseEstablishmentSettings(response.data)

  return data
    ? { ok: true, status: 200, data }
    : { ok: false, status: 502, error: "unavailable" }
}

export async function updateOpeningHours(
  tenantId: string,
  establishmentVersion: number,
  openingHours: OpeningHoursSchedule | null
): Promise<ApiResult<EstablishmentSettings>> {
  const path = `/api/v1/tenants/${tenantId}/establishment-settings/opening-hours`
  const response = openingHours
    ? await whitePlateApi.put(
        path,
        { openingHours },
        { ifMatch: `"${establishmentVersion}"` }
      )
    : await whitePlateApi.delete(path, { ifMatch: `"${establishmentVersion}"` })

  if (!response.ok) return response

  const data = parseEstablishmentSettings(response.data)

  return data
    ? { ok: true, status: 200, data }
    : { ok: false, status: 502, error: "unavailable" }
}

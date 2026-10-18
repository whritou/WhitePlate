import { browserRequest } from "./browser-request"
import { isRecord } from "@/lib/validation/common"
import {
  parseEstablishmentOptions,
  parseEstablishmentSettings,
  parsePublicEstablishment,
} from "@/lib/validation/establishment-settings"
import type { ApiError } from "@/types/api"
import type { EstablishmentRead } from "@/types/establishment-settings"
import { appendRestaurantSlugQuery } from "@/lib/storefront-preview-routing"

export class EstablishmentRequestError extends Error {
  constructor(readonly code: ApiError) {
    super(code)
  }
}

export async function fetchEstablishmentSettings(
  tenantId: string,
  signal: AbortSignal
): Promise<EstablishmentRead> {
  const response = await browserRequest(
    `/api/establishment-settings?${new URLSearchParams({ tenantId })}`,
    { signal }
  )

  if (!response.ok) throw new EstablishmentRequestError(response.error)

  const body = response.data
  const settings = isRecord(body)
    ? parseEstablishmentSettings(body.settings)
    : null
  const options = isRecord(body)
    ? parseEstablishmentOptions(body.options)
    : null

  if (!settings || !options) throw new EstablishmentRequestError("unavailable")

  return { settings, options }
}

export async function fetchPublicEstablishment(
  locale: string,
  signal: AbortSignal,
  restaurantSlug?: string
) {
  const path = appendRestaurantSlugQuery(
    `/api/public/establishment?${new URLSearchParams({ locale })}`,
    restaurantSlug
  )
  const response = await browserRequest(path, { signal })
  const result = response.ok ? parsePublicEstablishment(response.data) : null

  if (!result) throw new EstablishmentRequestError("unavailable")

  return result
}

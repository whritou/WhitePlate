import "server-only"
import { whitePlateApi } from "@/lib/api"
import { parseThemePublication } from "@/lib/validation/theme-publication"
import type { ApiResult } from "@/types/api"
import type { ThemePublication } from "@/types/theme"

export async function getThemePublication(
  tenantId: string,
  signal?: AbortSignal
): Promise<ApiResult<ThemePublication>> {
  const result = await whitePlateApi.get(
    `/api/v1/tenants/${tenantId}/theme/publication`,
    { signal }
  )

  if (!result.ok) return result

  const data = parseThemePublication(result.data)

  return data
    ? { ok: true, status: 200, data }
    : { ok: false, status: 502, error: "unavailable" }
}

export async function publishTheme(
  tenantId: string,
  draftVersion: number,
  publicationVersion: number,
  signal?: AbortSignal
): Promise<ApiResult<ThemePublication>> {
  const result = await whitePlateApi.post(
    `/api/v1/tenants/${tenantId}/theme/publication`,
    { draftVersion },
    { ifMatch: `"${publicationVersion}"`, signal }
  )

  if (!result.ok) return result

  const data = parseThemePublication(result.data)

  return data
    ? { ok: true, status: 200, data }
    : { ok: false, status: 502, error: "unavailable" }
}

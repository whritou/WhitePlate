import "server-only"
import { whitePlateApi } from "@/lib/api"
import {
  parseThemeDraft,
  parseThemePalette,
} from "@/lib/validation/theme-appearance"
import type { ApiResult } from "@/types/api"
import type {
  ThemeAppearance,
  ThemeDraft,
  ThemePaletteResult,
} from "@/types/theme"

export async function getThemeDraft(
  tenantId: string,
  signal?: AbortSignal
): Promise<ApiResult<ThemeDraft>> {
  const result = await whitePlateApi.get(`/api/v1/tenants/${tenantId}/theme`, {
    signal,
  })

  if (!result.ok) return result

  const data = parseThemeDraft(result.data)

  return data
    ? { ok: true, status: 200, data }
    : { ok: false, status: 502, error: "unavailable" }
}

export async function saveThemeDraft(
  tenantId: string,
  theme: ThemeAppearance,
  version: number,
  signal?: AbortSignal
): Promise<ApiResult<ThemeDraft>> {
  const result = await whitePlateApi.put(
    `/api/v1/tenants/${tenantId}/theme`,
    theme,
    { ifMatch: `"${version}"`, signal }
  )

  if (!result.ok) return result

  const data = parseThemeDraft(result.data)

  return data
    ? { ok: true, status: 200, data }
    : { ok: false, status: 502, error: "unavailable" }
}

export async function getThemePalette(
  tenantId: string,
  signal?: AbortSignal
): Promise<ApiResult<ThemePaletteResult>> {
  const result = await whitePlateApi.get(
    `/api/v1/tenants/${tenantId}/theme/palette`,
    { signal }
  )

  if (!result.ok) return result

  const data = parseThemePalette(result.data)

  return data
    ? { ok: true, status: 200, data }
    : { ok: false, status: 502, error: "unavailable" }
}

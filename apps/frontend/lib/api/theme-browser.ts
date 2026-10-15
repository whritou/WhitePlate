import { browserRequest } from "./browser-request"
import {
  parseThemeDraft,
  parseThemePalette,
} from "@/lib/validation/theme-appearance"
import type { ApiError } from "@/types/api"
import type { ThemeAppearance } from "@/types/theme"

export class ThemeRequestError extends Error {
  constructor(public code: ApiError) {
    super(code)
  }
}

export async function fetchThemeDraft(tenantId: string, signal: AbortSignal) {
  const result = await browserRequest(
    `/api/theme-settings?${new URLSearchParams({ tenantId })}`,
    { signal }
  )

  if (!result.ok) throw new ThemeRequestError(result.error)

  const data = parseThemeDraft(result.data)

  if (!data) throw new ThemeRequestError("unavailable")

  return data
}

export async function saveTenantTheme(
  tenantId: string,
  theme: ThemeAppearance,
  version: number
) {
  const result = await browserRequest(
    `/api/theme-settings?${new URLSearchParams({ tenantId })}`,
    { method: "PUT", body: { theme, version } }
  )

  if (!result.ok) throw new ThemeRequestError(result.error)

  const data = parseThemeDraft(result.data)

  if (!data) throw new ThemeRequestError("unavailable")

  return data
}

export async function fetchThemePalette(tenantId: string, signal: AbortSignal) {
  const result = await browserRequest(
    `/api/theme-settings?${new URLSearchParams({ tenantId, palette: "1" })}`,
    { signal }
  )

  if (!result.ok) throw new ThemeRequestError(result.error)

  const data = parseThemePalette(result.data)

  if (!data) throw new ThemeRequestError("unavailable")

  return data
}

import type { ApiRequestFactoryOptions, ApiTargetResult } from "@/types/api"

export function resolveApiUrl(
  path: string,
  baseUrl: ApiRequestFactoryOptions["baseUrl"]
): ApiTargetResult {
  if (!path.startsWith("/api/v1/") || path.includes("\\")) {
    return { ok: false, status: 400, error: "invalid" }
  }

  try {
    const value = typeof baseUrl === "function" ? baseUrl() : baseUrl

    if (!value) return { ok: false, status: 503, error: "unavailable" }

    const base = new URL(value)

    if (
      !["http:", "https:"].includes(base.protocol) ||
      base.username ||
      base.password
    ) {
      return { ok: false, status: 503, error: "unavailable" }
    }

    const url = new URL(path, base)

    if (url.origin !== base.origin || !url.pathname.startsWith("/api/v1/")) {
      return { ok: false, status: 400, error: "invalid" }
    }

    return { ok: true, url }
  } catch {
    return { ok: false, status: 503, error: "unavailable" }
  }
}

export function isBrowserApiPath(path: string): boolean {
  if (!path.startsWith("/api/") || path.includes("\\")) return false

  const base = "https://same-origin.invalid"
  const url = new URL(path, base)

  return url.origin === base && url.pathname.startsWith("/api/")
}

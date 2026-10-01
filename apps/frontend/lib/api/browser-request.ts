import { createJsonRequestClient } from "./json-request-client"
import { isBrowserApiPath } from "./request-url"
import type { ApiResult, BrowserRequestOptions } from "@/types/api"

const client = createJsonRequestClient({ credentials: "same-origin" })

export function browserRequest<T = unknown>(
  path: string,
  options?: BrowserRequestOptions
): Promise<ApiResult<T>> {
  if (!isBrowserApiPath(path)) {
    return Promise.resolve({ ok: false, status: 400, error: "invalid" })
  }

  return client.request<T>(path, options)
}

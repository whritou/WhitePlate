import { buildJsonRequestInit } from "./request-options"
import {
  createRequestDiagnostic,
  parseJsonResponse,
  requestFailure,
} from "./request-result"
import type {
  ApiResult,
  JsonRequestClient,
  JsonRequestClientOptions,
  JsonRequestOptions,
} from "@/types/api"

export function createJsonRequestClient({
  credentials = "omit",
  fetcher,
  onDiagnostic,
}: JsonRequestClientOptions = {}): JsonRequestClient {
  async function request<T = unknown>(
    target: string | URL,
    options: JsonRequestOptions = {}
  ): Promise<ApiResult<T>> {
    const diagnostic = createRequestDiagnostic(options.method ?? "GET", target)

    try {
      const response = await (fetcher ?? fetch)(
        target,
        buildJsonRequestInit(options, credentials)
      )

      return await parseJsonResponse<T>(
        response,
        diagnostic,
        onDiagnostic,
        options.responseType
      )
    } catch (error) {
      return requestFailure(503, diagnostic, onDiagnostic, error)
    }
  }

  return { request }
}

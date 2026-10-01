import { createJsonRequestClient } from "./json-request-client"
import { createRequestDiagnostic, requestFailure } from "./request-result"
import { resolveApiUrl } from "./request-url"
import type {
  ApiDiagnostic,
  ApiRequestFactoryOptions,
  ApiResult,
  PreparedApiRequest,
  RequestOptions,
} from "@/types/api"

export function createApiRequestFactory(
  configuration: ApiRequestFactoryOptions
) {
  const request = createApiRequest(configuration)

  return {
    get: <T>(path: string, options?: RequestOptions) =>
      request<T>("GET", path, undefined, options),
    post: <T, B = unknown>(path: string, body: B, options?: RequestOptions) =>
      request<T>("POST", path, body, options),
    put: <T, B = unknown>(path: string, body: B, options?: RequestOptions) =>
      request<T>("PUT", path, body, options),
    patch: <T, B = unknown>(path: string, body: B, options?: RequestOptions) =>
      request<T>("PATCH", path, body, options),
    delete: <T>(path: string, options?: RequestOptions) =>
      request<T>("DELETE", path, undefined, options),
  }
}

function createApiRequest(configuration: ApiRequestFactoryOptions) {
  const client = createJsonRequestClient(configuration)

  return async function request<T>(
    method: ApiDiagnostic["method"],
    path: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResult<T>> {
    const prepared = await prepareApiRequest(method, path, configuration)

    if (!prepared.ok) return prepared

    return client.request<T>(prepared.url, {
      ...options,
      method,
      body,
      bearerToken: prepared.bearerToken,
    })
  }
}

async function prepareApiRequest(
  method: ApiDiagnostic["method"],
  path: string,
  configuration: ApiRequestFactoryOptions
): Promise<PreparedApiRequest> {
  const diagnostic = createRequestDiagnostic(method, path)
  const target = resolveApiUrl(path, configuration.baseUrl)

  if (!target.ok) {
    return requestFailure(target.status, diagnostic, configuration.onDiagnostic)
  }

  try {
    const token = configuration.public ? null : await configuration.getToken()

    if (!configuration.public && !token) {
      return { ok: false, status: 401, error: "unauthorized" }
    }

    return { ok: true, url: target.url, bearerToken: token ?? undefined }
  } catch (error) {
    return requestFailure(503, diagnostic, configuration.onDiagnostic, error)
  }
}

import type {
  ApiError,
  ApiResult,
  ApiDiagnostic,
  RequestOptions,
  ApiRequestFactoryOptions,
} from "@/types/api"

export function createApiRequestFactory({
  baseUrl,
  getToken,
  public: isPublic = false,
  fetcher = fetch,
  onDiagnostic,
}: ApiRequestFactoryOptions) {
  async function request<T>(
    method: ApiDiagnostic["method"],
    path: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResult<T>> {
    const diagnostic: ApiDiagnostic = {
      method,
      path: safeDiagnosticPath(path),
      status: 503,
    }
    const fail = (status: number, error: ApiError): ApiResult<T> => ({
      ok: false,
      status,
      error,
    })
    const record = () => {
      try {
        onDiagnostic?.(diagnostic)
      } catch {
        // Logging failures must not change the safe response returned to callers.
      }
    }

    if (!path.startsWith("/api/v1/") || path.includes("\\")) {
      diagnostic.status = 400
      record()
      return fail(400, "invalid")
    }

    let configuredBaseUrl: string | undefined
    let url: URL
    try {
      configuredBaseUrl = typeof baseUrl === "function" ? baseUrl() : baseUrl
      if (!configuredBaseUrl) {
        record()
        return fail(503, "unavailable")
      }
      const base = new URL(configuredBaseUrl)
      if (
        (base.protocol !== "http:" && base.protocol !== "https:") ||
        base.username ||
        base.password
      ) {
        record()
        return fail(503, "unavailable")
      }
      url = new URL(path, base)
      if (url.origin !== base.origin || !url.pathname.startsWith("/api/v1/")) {
        diagnostic.status = 400
        record()
        return fail(400, "invalid")
      }
    } catch {
      record()
      return fail(503, "unavailable")
    }

    let token: string | null = null
    if (!isPublic) {
      try {
        token = await getToken()
      } catch (error) {
        diagnostic.causeName = safeCauseName(error)
        record()
        return fail(503, "unavailable")
      }
      if (!token) return fail(401, "unauthorized")
    }

    try {
      const headers = new Headers({ Accept: "application/json" })
      if (token) headers.set("Authorization", `Bearer ${token}`)
      if (body !== undefined) headers.set("Content-Type", "application/json")
      if (options.idempotencyKey)
        headers.set("Idempotency-Key", options.idempotencyKey)
      if (options.ifMatch) headers.set("If-Match", options.ifMatch)

      const response = await fetcher(url, {
        method,
        headers,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        cache: "no-store",
        credentials: "omit",
        redirect: "error",
        signal: options.signal,
      })

      if (!response.ok) {
        diagnostic.status = response.status
        diagnostic.code = safeHeader(response.headers.get("x-error-code"))
        diagnostic.traceId = safeHeader(
          response.headers.get("x-request-id") ??
            response.headers.get("trace-id")
        )
        record()
        return fail(response.status, mapStatus(response.status))
      }

      if (
        response.status === 204 ||
        response.body === null ||
        !response.headers.get("content-type")?.includes("json")
      ) {
        return { ok: true, status: response.status, data: null }
      }

      try {
        const data = (await response.json()) as T
        return { ok: true, status: response.status, data }
      } catch (error) {
        diagnostic.status = 502
        diagnostic.causeName = safeCauseName(error)
        record()
        return fail(502, "unavailable")
      }
    } catch (error) {
      diagnostic.status = 503
      diagnostic.causeName = safeCauseName(error)
      record()
      return fail(503, "unavailable")
    }
  }

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

function mapStatus(status: number): ApiError {
  if (status === 400 || status === 422) return "invalid"
  if (status === 401) return "unauthorized"
  if (status === 403) return "forbidden"
  if (status === 404) return "not_found"
  if (status === 409 || status === 412) return "conflict"
  if (status === 429) return "rate_limited"
  return "unavailable"
}

function safeDiagnosticPath(path: string): string {
  return path.split(/[?#]/, 1)[0]?.slice(0, 200) ?? "/api/v1"
}

function safeHeader(value: string | null): string | undefined {
  return value && /^[a-zA-Z0-9._:-]{1,100}$/.test(value) ? value : undefined
}

function safeCauseName(error: unknown): string | undefined {
  if (!(error instanceof Error)) return undefined
  return /^[A-Za-z][A-Za-z0-9]{0,63}$/.test(error.name) ? error.name : undefined
}

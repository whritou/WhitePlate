export type ApiError =
  | "unauthorized"
  | "forbidden"
  | "invalid"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "unavailable"

export type ApiResult<T> =
  | { ok: true; status: number; data: T | null }
  | { ok: false; status: number; error: ApiError }

export type ApiDiagnostic = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  path: string
  status: number
  code?: string
  traceId?: string
  causeName?: string
}

export type RequestOptions = {
  signal?: AbortSignal
  idempotencyKey?: string
  ifMatch?: string
}

export type ApiRequestFactoryOptions = {
  baseUrl: string | undefined | (() => string | undefined)
  getToken: () => Promise<string | null>
  public?: boolean
  fetcher?: typeof fetch
  onDiagnostic?: (diagnostic: ApiDiagnostic) => void
}

export type ApiLocale = "en" | "fr"

export type TenantResource = "details" | "menu"

export type JsonRequestOptions = RequestOptions & {
  method?: ApiDiagnostic["method"]
  body?: unknown
  bearerToken?: string
  responseType?: "json" | "none"
}

export type JsonRequestClientOptions = {
  credentials?: "omit" | "same-origin"
  fetcher?: typeof fetch
  onDiagnostic?: (diagnostic: ApiDiagnostic) => void
}

export type BrowserRequestOptions = Omit<JsonRequestOptions, "bearerToken">

export type ApiFailure = Extract<ApiResult<never>, { ok: false }>

export type ApiTargetResult = { ok: true; url: URL } | ApiFailure

export type PreparedApiRequest =
  { ok: true; url: URL; bearerToken?: string } | ApiFailure

export type JsonRequestClient = {
  request: <T = unknown>(
    target: string | URL,
    options?: JsonRequestOptions
  ) => Promise<ApiResult<T>>
}

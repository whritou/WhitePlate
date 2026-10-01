import type {
  ApiDiagnostic,
  ApiError,
  ApiFailure,
  ApiResult,
} from "@/types/api"

export function createRequestDiagnostic(
  method: ApiDiagnostic["method"],
  target: string | URL
): ApiDiagnostic {
  const path = String(target).split(/[?#]/, 1)[0] ?? "/api/v1"
  const safePath = path.startsWith("/") ? path : safeUrlPath(path)

  return { method, path: safePath.slice(0, 200), status: 503 }
}

function safeUrlPath(target: string): string {
  try {
    return new URL(target).pathname
  } catch {
    return "/api/v1"
  }
}

export function requestFailure(
  status: number,
  diagnostic: ApiDiagnostic,
  onDiagnostic?: (diagnostic: ApiDiagnostic) => void,
  cause?: unknown
): ApiFailure {
  const causeName =
    cause instanceof Error && /^[A-Za-z][A-Za-z0-9]{0,63}$/.test(cause.name)
      ? cause.name
      : undefined

  try {
    onDiagnostic?.({
      ...diagnostic,
      status,
      ...(causeName ? { causeName } : {}),
    })
  } catch {
    // A diagnostic sink must never change the request result.
  }

  return { ok: false, status, error: mapHttpStatus(status) }
}

export async function parseJsonResponse<T>(
  response: Response,
  diagnostic: ApiDiagnostic,
  onDiagnostic?: (diagnostic: ApiDiagnostic) => void,
  responseType: "json" | "none" = "json"
): Promise<ApiResult<T>> {
  if (!response.ok) {
    return requestFailure(
      response.status,
      {
        ...diagnostic,
        code: safeHeader(response.headers.get("x-error-code")),
        traceId: safeHeader(
          response.headers.get("x-request-id") ??
            response.headers.get("trace-id")
        ),
      },
      onDiagnostic
    )
  }

  if (
    responseType === "none" ||
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
    return requestFailure(502, diagnostic, onDiagnostic, error)
  }
}

function mapHttpStatus(status: number): ApiError {
  if (status === 400 || status === 422) return "invalid"
  if (status === 401) return "unauthorized"
  if (status === 403) return "forbidden"
  if (status === 404) return "not_found"
  if (status === 409 || status === 412) return "conflict"
  if (status === 429) return "rate_limited"

  return "unavailable"
}

function safeHeader(value: string | null): string | undefined {
  return value && /^[a-zA-Z0-9._:-]{1,100}$/.test(value) ? value : undefined
}

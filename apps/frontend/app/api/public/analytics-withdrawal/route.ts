import { createApiRequestFactory } from "@/lib/api/request-factory"

const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" }

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return Response.json({ ok: false }, { status: 400, headers })
  }

  if (!body || typeof body !== "object" || Array.isArray(body))
    return Response.json({ ok: false }, { status: 400, headers })

  const value = body as Record<string, unknown>

  if (
    typeof value.tenantId !== "string" ||
    !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value.tenantId) ||
    typeof value.email !== "string" ||
    value.email.length > 254
  )
    return Response.json({ ok: false }, { status: 400, headers })

  const api = createApiRequestFactory({
    baseUrl: process.env.API_BASE_URL,
    getToken: async () => null,
    public: true,
  })
  const response = await api.post<unknown>(
    `/api/v1/tenants/${value.tenantId}/analytics/withdrawal`,
    { email: value.email },
    { signal: request.signal }
  )

  return Response.json(
    { ok: response.ok },
    { status: response.status, headers }
  )
}

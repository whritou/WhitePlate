import { isRecord, isUuid } from "@/lib/validation/common"
import { getThemePublication, publishTheme } from "@/services/theme-publication"

const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" }
const reply = (body: unknown, status: number) =>
  Response.json(body, { status, headers })

function tenant(request: Request) {
  const query = new URL(request.url).searchParams

  return query.size === 1 && isUuid(query.get("tenantId"))
    ? query.get("tenantId")
    : null
}

function publicationVersion(request: Request) {
  const value = request.headers.get("if-match") ?? ""
  const match = /^"([1-9][0-9]{0,9})"$/.exec(value)
  const version = match ? Number(match[1]) : 0

  return Number.isInteger(version) && version <= 2147483647 ? version : null
}

function hasExactOrigin(request: Request) {
  const origin = new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000")
    .origin

  return request.headers.get("origin") === origin
}

export async function GET(request: Request) {
  const tenantId = tenant(request)

  if (!tenantId) return reply({ error: "invalid" }, 400)

  const result = await getThemePublication(tenantId, request.signal)

  return reply(result.ok ? result.data : result, result.status)
}

export async function POST(request: Request) {
  if (!hasExactOrigin(request)) return reply({ error: "forbidden" }, 403)

  const tenantId = tenant(request)
  const version = publicationVersion(request)

  if (!tenantId) return reply({ error: "invalid" }, 400)
  if (version === null) return reply({ error: "precondition_required" }, 428)

  const body = await limitedJson(request)

  if (
    !isRecord(body) ||
    Object.keys(body).length !== 1 ||
    !Number.isInteger(body.draftVersion) ||
    Number(body.draftVersion) < 1 ||
    Number(body.draftVersion) > 2147483647
  )
    return reply({ error: "invalid" }, 400)

  const result = await publishTheme(
    tenantId,
    Number(body.draftVersion),
    version,
    request.signal
  )

  return reply(result.ok ? result.data : result, result.status)
}

async function limitedJson(request: Request): Promise<unknown> {
  if (!request.body || Number(request.headers.get("content-length")) > 4096)
    return null

  const reader = request.body.getReader()
  const chunks: Uint8Array<ArrayBuffer>[] = []
  let length = 0

  try {
    while (true) {
      const { value, done } = await reader.read()

      if (done) break
      length += value.byteLength
      if (length > 4096) {
        await reader.cancel()

        return null
      }

      chunks.push(new Uint8Array(value))
    }

    return JSON.parse(await new Blob(chunks).text())
  } catch {
    return null
  } finally {
    reader.releaseLock()
  }
}

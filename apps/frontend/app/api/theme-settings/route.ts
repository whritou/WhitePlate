import { isRecord, isUuid } from "@/lib/validation/common"
import { parseThemeAppearance } from "@/lib/validation/theme-appearance"
import {
  getThemeDraft,
  getThemePalette,
  saveThemeDraft,
} from "@/services/theme-settings"

const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" }
const reply = (body: unknown, status: number) =>
  Response.json(body, { status, headers })

function tenant(request: Request) {
  const query = new URL(request.url).searchParams
  const tenantId = query.get("tenantId")

  return isUuid(tenantId) &&
    query.getAll("tenantId").length === 1 &&
    query.getAll("palette").length <= 1
    ? tenantId
    : null
}

export async function GET(request: Request) {
  const tenantId = tenant(request)

  if (!tenantId) return reply({ error: "invalid" }, 400)

  const result =
    new URL(request.url).searchParams.get("palette") === "1"
      ? await getThemePalette(tenantId, request.signal)
      : await getThemeDraft(tenantId, request.signal)

  return reply(result.ok ? result.data : result, result.status)
}

export async function PUT(request: Request) {
  const origin = new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000")
    .origin

  if (request.headers.get("origin") !== origin)
    return reply({ error: "forbidden" }, 403)

  const tenantId = tenant(request)

  if (!tenantId) return reply({ error: "invalid" }, 400)

  const body = await limitedJson(request)
  const theme = isRecord(body) ? parseThemeAppearance(body.theme) : null

  if (
    !theme ||
    !isRecord(body) ||
    !Number.isInteger(body.version) ||
    Number(body.version) < 1 ||
    Number(body.version) > 2147483647
  )
    return reply({ error: "invalid" }, 400)

  const result = await saveThemeDraft(
    tenantId,
    theme,
    Number(body.version),
    request.signal
  )

  return reply(result.ok ? result.data : result, result.status)
}

async function limitedJson(request: Request): Promise<unknown> {
  if (!request.body || Number(request.headers.get("content-length")) > 8192)
    return null

  const reader = request.body.getReader()
  const chunks: Uint8Array<ArrayBuffer>[] = []
  let length = 0

  try {
    while (true) {
      const { value, done } = await reader.read()

      if (done) break
      length += value.byteLength
      if (length > 8192) {
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

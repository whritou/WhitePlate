import { isUuid } from "@/lib/validation/common"
import { isBrandSlot } from "@/lib/brand-assets"
import {
  getBrandAssets,
  readBrandAsset,
  uploadBrandAsset,
  changeBrandAsset,
} from "@/services/brand-assets"

const privateHeaders = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie",
  "X-Content-Type-Options": "nosniff",
}
const reply = (value: unknown, status: number) =>
  Response.json(value, { status, headers: privateHeaders })

function selectors(request: Request) {
  const query = new URL(request.url).searchParams
  const tenantId = query.get("tenantId")
  const slot = query.get("slot")
  const assetId = query.get("assetId")
  const aspect = query.get("aspect") ?? "16:9"

  if (
    !isUuid(tenantId) ||
    ["tenantId", "slot", "assetId", "aspect"].some(
      (key) => query.getAll(key).length > 1
    ) ||
    (slot !== null && !isBrandSlot(slot)) ||
    (assetId !== null && !isUuid(assetId)) ||
    !["16:9", "21:9"].includes(aspect)
  )
    return null

  return { tenantId, slot, assetId, aspect }
}

function trustedMutation(request: Request) {
  return (
    request.headers.get("origin") ===
    new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000").origin
  )
}

export async function GET(request: Request) {
  const selection = selectors(request)

  if (!selection) return reply({ ok: false, error: "invalid" }, 400)

  if (selection.assetId) {
    const result = await readBrandAsset(
      selection.tenantId,
      selection.assetId,
      request.signal
    )

    return result.ok && result.data
      ? new Response(result.data, {
          headers: { ...privateHeaders, "Content-Type": result.data.type },
        })
      : reply(result, result.status)
  }

  const result = await getBrandAssets(selection.tenantId)

  return reply(result.ok ? result.data : result, result.status)
}

export async function POST(request: Request) {
  const selection = selectors(request)

  if (!trustedMutation(request))
    return reply({ ok: false, error: "forbidden" }, 403)
  if (!selection || !isBrandSlot(selection.slot))
    return reply({ ok: false, error: "invalid" }, 400)

  const access = await getBrandAssets(selection.tenantId)

  if (!access.ok) return reply(access, access.status)

  const maximum =
    { logo: 2, favicon: 1, banner: 4 }[selection.slot] * 1024 * 1024
  const bytes = await readLimitedBody(request, maximum)

  if (!bytes) return reply({ ok: false, error: "invalid" }, 413)

  const result = await uploadBrandAsset(
    selection.tenantId,
    selection.slot,
    selection.aspect,
    bytes,
    request.signal
  )

  return reply(result.ok ? result.data : result, result.status)
}

export async function PUT(request: Request) {
  return change(request, false)
}

export async function DELETE(request: Request) {
  return change(request, true)
}

async function change(request: Request, remove: boolean) {
  const selection = selectors(request)

  if (!trustedMutation(request))
    return reply({ ok: false, error: "forbidden" }, 403)
  if (!selection || !isBrandSlot(selection.slot))
    return reply({ ok: false, error: "invalid" }, 400)

  const expected = request.headers.get("if-match")?.replace(/^"|"$/g, "")

  if (expected !== "none" && !isUuid(expected))
    return reply({ ok: false, error: "invalid" }, 400)

  let assetId: string | null = null

  if (!remove) {
    const bytes = await readLimitedBody(request, 1024)
    const body = bytes
      ? await bytes
          .text()
          .then((text) => JSON.parse(text))
          .catch(() => null)
      : null

    if (!isUuid(body?.assetId))
      return reply({ ok: false, error: "invalid" }, 400)
    assetId = body.assetId
  }

  const result = await changeBrandAsset(
    selection.tenantId,
    selection.slot,
    expected!,
    assetId
  )

  return reply(result, result.status === 204 ? 200 : result.status)
}

async function readLimitedBody(
  request: Request,
  maximum: number
): Promise<Blob | null> {
  if (Number(request.headers.get("content-length")) > maximum || !request.body)
    return null

  const reader = request.body.getReader()
  const chunks: Uint8Array<ArrayBuffer>[] = []
  let size = 0

  try {
    while (true) {
      const { value, done } = await reader.read()

      if (done) break
      size += value.byteLength
      if (size > maximum) {
        await reader.cancel()

        return null
      }

      chunks.push(new Uint8Array(value))
    }

    return size ? new Blob(chunks) : null
  } catch {
    return null
  } finally {
    reader.releaseLock()
  }
}

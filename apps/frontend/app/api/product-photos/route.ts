import { isUuid } from "@/lib/validation/common"
import { readLimitedBody } from "@/lib/api/limited-body"
import {
  getProductPhotos,
  readProductPhoto,
  uploadProductPhoto,
  saveProductPhotos,
} from "@/services/product-photos"
import type { PhotoSelection } from "@/types/product-photos"

const privateHeaders = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie",
  "X-Content-Type-Options": "nosniff",
}
const reply = (value: unknown, status: number) =>
  Response.json(value, { status, headers: privateHeaders })

function selectors(request: Request): PhotoSelection | null {
  const query = new URL(request.url).searchParams
  const tenantId = query.get("tenantId")
  const productId = query.get("productId")
  const assetId = query.get("assetId")
  const aspect = query.get("aspect") ?? "1:1"
  const size = Number(query.get("size") ?? 1200)

  if (
    !isUuid(tenantId) ||
    !isUuid(productId) ||
    (assetId !== null && !isUuid(assetId)) ||
    !["1:1", "4:3"].includes(aspect) ||
    ![320, 640, 1200].includes(size) ||
    ["tenantId", "productId", "assetId", "aspect", "size"].some(
      (key) => query.getAll(key).length > 1
    )
  )
    return null

  return { tenantId, productId, assetId, aspect, size }
}

function trusted(request: Request) {
  return (
    request.headers.get("origin") ===
    new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000").origin
  )
}

export async function GET(request: Request) {
  const selection = selectors(request)

  if (!selection) return reply({ ok: false, error: "invalid" }, 400)

  const { tenantId, productId, assetId, size } = selection

  if (assetId) {
    const result = await readProductPhoto(
      tenantId,
      productId,
      assetId,
      size,
      request.signal
    )

    return result.ok && result.data
      ? new Response(result.data, {
          headers: { ...privateHeaders, "Content-Type": result.data.type },
        })
      : reply(result, result.status)
  }

  const result = await getProductPhotos(tenantId, productId, request.signal)

  return reply(result.ok ? result.data : result, result.status)
}

export async function POST(request: Request) {
  if (!trusted(request)) return reply({ ok: false, error: "forbidden" }, 403)

  const selection = selectors(request)

  if (!selection) return reply({ ok: false, error: "invalid" }, 400)

  const access = await getProductPhotos(
    selection.tenantId,
    selection.productId,
    request.signal
  )

  if (!access.ok) return reply(access, access.status)

  const bytes = await readLimitedBody(request, 4 * 1024 * 1024)

  if (!bytes) return reply({ ok: false, error: "invalid" }, 413)

  const result = await uploadProductPhoto(
    selection.tenantId,
    selection.productId,
    selection.aspect,
    bytes,
    request.signal
  )

  return reply(result.ok ? result.data : result, result.status)
}

export async function PUT(request: Request) {
  if (!trusted(request)) return reply({ ok: false, error: "forbidden" }, 403)

  const selection = selectors(request)

  if (!selection) return reply({ ok: false, error: "invalid" }, 400)

  const bytes = await readLimitedBody(request, 2048)
  const body = bytes
    ? await bytes
        .text()
        .then((text) => JSON.parse(text))
        .catch(() => null)
    : null

  if (
    !body ||
    ![body.assetIds, body.expectedIds].every(
      (ids) =>
        Array.isArray(ids) &&
        ids.length <= 8 &&
        ids.every(isUuid) &&
        new Set(ids).size === ids.length
    )
  )
    return reply({ ok: false, error: "invalid" }, 400)

  const result = await saveProductPhotos(
    selection.tenantId,
    selection.productId,
    { assetIds: body.assetIds, expectedIds: body.expectedIds }
  )

  return reply(result.ok ? result.data : result, result.status)
}

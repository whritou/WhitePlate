import "server-only"
import { whitePlateApi } from "@/lib/api"
import { parseProductPhoto, parseProductPhotos } from "@/lib/product-photos"
import type { PhotoMutation } from "@/types/product-photos"

const path = (tenant: string, product: string) =>
  `/api/v1/tenants/${tenant}/products/${product}/photos`

export async function getProductPhotos(
  tenant: string,
  product: string,
  signal?: AbortSignal
) {
  const response = await whitePlateApi.get<unknown>(path(tenant, product), {
    signal,
  })

  if (!response.ok) return response

  const data = parseProductPhotos(response.data)

  return data
    ? { ok: true as const, status: 200, data }
    : { ok: false as const, status: 502, error: "unavailable" as const }
}

export async function uploadProductPhoto(
  tenant: string,
  product: string,
  aspect: string,
  file: Blob,
  signal: AbortSignal
) {
  const response = await whitePlateApi.upload<unknown>(
    `${path(tenant, product)}/uploads?aspect=${encodeURIComponent(aspect)}`,
    file,
    { signal }
  )

  if (!response.ok) return response

  const data = parseProductPhoto(response.data)

  return data
    ? { ok: true as const, status: 201, data }
    : { ok: false as const, status: 502, error: "unavailable" as const }
}

export function readProductPhoto(
  tenant: string,
  product: string,
  asset: string,
  size: number,
  signal: AbortSignal
) {
  return whitePlateApi.image(
    `${path(tenant, product)}/uploads/${asset}/${size}`,
    { signal }
  )
}

export async function saveProductPhotos(
  tenant: string,
  product: string,
  body: PhotoMutation
) {
  const response = await whitePlateApi.put<unknown>(path(tenant, product), body)

  if (!response.ok) return response

  const data = parseProductPhotos(response.data)

  return data
    ? { ok: true as const, status: 200, data }
    : { ok: false as const, status: 502, error: "unavailable" as const }
}

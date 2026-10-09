import { isUuid } from "./validation/common"
import type { ProductPhoto, ProductPhotos } from "@/types/product-photos"

export function parseProductPhoto(value: unknown): ProductPhoto | null {
  if (!value || typeof value !== "object") return null

  const data = value as Record<string, unknown>

  if (
    !isUuid(data.id) ||
    ![data.width, data.height, data.bytes].every(
      (item) =>
        typeof item === "number" && Number.isSafeInteger(item) && item > 0
    ) ||
    (data.width as number) > 1200 ||
    (data.height as number) > 1200 ||
    (data.bytes as number) > 24 * 1024 * 1024
  )
    return null

  return {
    id: data.id,
    width: data.width as number,
    height: data.height as number,
    bytes: data.bytes as number,
  }
}

export function parsePhotoList(value: unknown): ProductPhoto[] | null {
  if (!Array.isArray(value) || value.length > 8) return null

  const photos = value.map(parseProductPhoto)

  if (
    photos.some((item) => !item) ||
    new Set(photos.map((item) => item?.id)).size !== photos.length
  )
    return null

  return photos as ProductPhoto[]
}

export function parseProductPhotos(value: unknown): ProductPhotos | null {
  if (!value || typeof value !== "object") return null

  const data = value as Record<string, unknown>
  const assets = parsePhotoList(data.assets)

  return typeof data.storageAvailable === "boolean" && assets
    ? { storageAvailable: data.storageAvailable, assets }
    : null
}

export function photoUrl(
  productId: string,
  id: string,
  size: number,
  tenantId?: string
) {
  if (
    !isUuid(productId) ||
    !isUuid(id) ||
    ![320, 640, 1200].includes(size) ||
    (tenantId && !isUuid(tenantId))
  )
    return undefined

  return tenantId
    ? `/api/product-photos?${new URLSearchParams({ tenantId, productId, assetId: id, size: String(size) })}`
    : `/api/public/product-photos/${productId}/${id}/${size}`
}

export function validatePhotoFile(file: File) {
  return file.size > 0 && file.size <= 4 * 1024 * 1024
}

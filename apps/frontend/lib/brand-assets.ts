import { isUuid } from "./validation/common"
import type { BrandAsset, BrandAssets, BrandSlot } from "@/types/brand-assets"

export function isBrandSlot(value: unknown): value is BrandSlot {
  return value === "logo" || value === "favicon" || value === "banner"
}

export function parseBrandAsset(value: unknown): BrandAsset | null {
  if (!value || typeof value !== "object") return null

  const data = value as Record<string, unknown>

  if (
    !isUuid(data.id) ||
    !isBrandSlot(data.slot) ||
    (data.contentType !== "image/png" && data.contentType !== "image/webp") ||
    ![data.width, data.height, data.bytes].every(
      (item) => typeof item === "number" && Number.isInteger(item) && item > 0
    ) ||
    (data.width as number) > 4096 ||
    (data.height as number) > 4096 ||
    (data.bytes as number) > 8 * 1024 * 1024
  )
    return null

  return data as BrandAsset
}

export function parseBrandAssets(value: unknown): BrandAssets | null {
  if (!value || typeof value !== "object") return null

  const data = value as Record<string, unknown>

  if (
    typeof data.storageAvailable !== "boolean" ||
    !Array.isArray(data.assets) ||
    data.assets.length > 3
  )
    return null

  const assets = data.assets.map(parseBrandAsset)

  if (
    assets.some((asset) => !asset) ||
    new Set(assets.map((asset) => asset?.slot)).size !== assets.length
  )
    return null

  return {
    storageAvailable: data.storageAvailable,
    assets: assets as BrandAsset[],
  }
}

export function brandPreviewUrl(tenantId: string, id: string) {
  return `/api/brand-assets?${new URLSearchParams({ tenantId, assetId: id })}`
}

export function validateBrandFile(slot: BrandSlot, file: File): boolean {
  const maximum = { logo: 2, favicon: 1, banner: 4 }[slot] * 1024 * 1024

  return file.size > 0 && file.size <= maximum
}

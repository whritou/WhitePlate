import type { ApiError } from "./api"

export type BrandSlot = "logo" | "favicon" | "banner"
export type BrandAsset = {
  id: string
  slot: BrandSlot
  contentType: "image/png" | "image/webp"
  width: number
  height: number
  bytes: number
}
export type BrandAssets = { storageAvailable: boolean; assets: BrandAsset[] }
export type BrandAssetsProps = {
  userId: string
  tenantId: string
  restaurantName: string
  initialData?: BrandAssets
}
export type BrandDraft = { asset: BrandAsset; url: string }
export type BrandOperationError = ApiError | "offline"
export type BrandSlotProps = {
  tenantId: string
  slot: BrandSlot
  active?: BrandAsset
  available: boolean
  onSaved: (slot?: BrandSlot, asset?: BrandAsset | null) => Promise<unknown>
  onPreview: (slot: BrandSlot, url?: string) => void
}
export type BrandPreviewProps = {
  restaurantName: string
  tenantId: string
  assets: BrandAsset[]
  drafts: Partial<Record<BrandSlot, string>>
}
export type BrandPageProps = { searchParams: Promise<{ tenantId?: string }> }

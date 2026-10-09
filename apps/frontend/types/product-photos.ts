import type { ApiError } from "./api"

export type ProductPhoto = {
  id: string
  width: number
  height: number
  bytes: number
}
export type ProductPhotos = {
  storageAvailable: boolean
  assets: ProductPhoto[]
}
export type PhotoScope = { userId: string; tenantId: string; productId: string }
export type ProductPhotosProps = PhotoScope & {
  archived?: boolean
  onPendingChange?: (busy: boolean) => void
}
export type PhotoError = ApiError | "offline"
export type PhotoUploadAttempt = { file: File; target?: string; aspect: string }
export type PhotoMutation = { assetIds: string[]; expectedIds: string[] }
export type PhotoSelection = {
  tenantId: string
  productId: string
  assetId: string | null
  aspect: string
  size: number
}

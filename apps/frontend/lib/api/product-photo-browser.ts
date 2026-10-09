import { browserRequest } from "./browser-request"
import { BrandRequestError } from "./brand-browser"
import { parseProductPhoto, parseProductPhotos } from "@/lib/product-photos"
import type { PhotoMutation } from "@/types/product-photos"

const path = (tenantId: string, productId: string, aspect?: string) =>
  `/api/product-photos?${new URLSearchParams({ tenantId, productId, ...(aspect ? { aspect } : {}) })}`

export async function fetchProductPhotos(
  tenantId: string,
  productId: string,
  signal: AbortSignal
) {
  const response = await browserRequest(path(tenantId, productId), { signal })

  if (!response.ok) throw new BrandRequestError(response.error)

  const data = parseProductPhotos(response.data)

  if (!data) throw new BrandRequestError("unavailable")

  return data
}

export async function uploadProductFile(
  tenantId: string,
  productId: string,
  aspect: string,
  file: File,
  progress: (percent: number) => void,
  signal: AbortSignal
) {
  const response = await browserRequest(path(tenantId, productId, aspect), {
    method: "POST",
    body: file,
    bodyType: "binary",
    onUploadProgress: progress,
    signal,
  })

  if (!response.ok) throw new BrandRequestError(response.error)

  const data = parseProductPhoto(response.data)

  if (!data) throw new BrandRequestError("unavailable")

  return data
}

export async function saveProductGallery(
  tenantId: string,
  productId: string,
  body: PhotoMutation
) {
  const response = await browserRequest(path(tenantId, productId), {
    method: "PUT",
    body,
  })

  if (!response.ok) throw new BrandRequestError(response.error)

  const data = parseProductPhotos(response.data)

  if (!data) throw new BrandRequestError("unavailable")

  return data
}

import { browserRequest } from "./browser-request"
import { parseBrandAsset, parseBrandAssets } from "@/lib/brand-assets"
import type { BrandSlot } from "@/types/brand-assets"
import type { ApiError } from "@/types/api"

export class BrandRequestError extends Error {
  constructor(public code: ApiError) {
    super(code)
  }
}

export async function fetchBrandAssets(tenantId: string, signal: AbortSignal) {
  const response = await browserRequest(
    `/api/brand-assets?${new URLSearchParams({ tenantId })}`,
    { signal }
  )

  if (!response.ok) throw new BrandRequestError(response.error)

  const data = parseBrandAssets(response.data)

  if (!data) throw new BrandRequestError("unavailable")

  return data
}

export async function uploadBrandFile(
  tenantId: string,
  slot: BrandSlot,
  aspect: string,
  file: File,
  onUploadProgress: (percent: number) => void,
  signal: AbortSignal
) {
  const path = `/api/brand-assets?${new URLSearchParams({ tenantId, slot, aspect })}`
  const response = await browserRequest(path, {
    method: "POST",
    body: file,
    bodyType: "binary",
    onUploadProgress,
    signal,
  })

  if (!response.ok) throw new BrandRequestError(response.error)

  const data = parseBrandAsset(response.data)

  if (!data) throw new BrandRequestError("unavailable")

  return data
}

export async function saveBrandFile(
  tenantId: string,
  slot: BrandSlot,
  expected: string,
  assetId: string | null
) {
  const response = await browserRequest(
    `/api/brand-assets?${new URLSearchParams({ tenantId, slot })}`,
    {
      method: assetId ? "PUT" : "DELETE",
      body: assetId ? { assetId } : undefined,
      ifMatch: `"${expected}"`,
    }
  )

  if (!response.ok) throw new BrandRequestError(response.error)
}

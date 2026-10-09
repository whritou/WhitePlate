import "server-only"
import { whitePlateApi } from "@/lib/api"
import { parseBrandAsset, parseBrandAssets } from "@/lib/brand-assets"
import type { ApiResult } from "@/types/api"
import type { BrandSlot } from "@/types/brand-assets"

export async function getBrandAssets(tenantId: string) {
  const response = await whitePlateApi.get<unknown>(
    `/api/v1/tenants/${tenantId}/brand-assets`
  )

  if (!response.ok) return response

  const data = parseBrandAssets(response.data)

  return data
    ? { ok: true as const, status: 200, data }
    : { ok: false as const, status: 502, error: "unavailable" as const }
}

export async function uploadBrandAsset(
  tenantId: string,
  slot: BrandSlot,
  aspect: string,
  bytes: Blob,
  signal: AbortSignal
) {
  const response = await whitePlateApi.upload<unknown>(
    `/api/v1/tenants/${tenantId}/brand-assets/${slot}/uploads?aspect=${encodeURIComponent(aspect)}`,
    bytes,
    { signal }
  )

  if (!response.ok) return response

  const data = parseBrandAsset(response.data)

  return data
    ? { ok: true as const, status: 201, data }
    : { ok: false as const, status: 502, error: "unavailable" as const }
}

export function readBrandAsset(
  tenantId: string,
  assetId: string,
  signal: AbortSignal
): Promise<ApiResult<Blob>> {
  return whitePlateApi.image(
    `/api/v1/tenants/${tenantId}/brand-assets/uploads/${assetId}`,
    { signal }
  )
}

export function changeBrandAsset(
  tenantId: string,
  slot: BrandSlot,
  expected: string,
  assetId: string | null
) {
  const path = `/api/v1/tenants/${tenantId}/brand-assets/${slot}`

  return assetId
    ? whitePlateApi.put(path, { assetId }, { ifMatch: `"${expected}"` })
    : whitePlateApi.delete(path, { ifMatch: `"${expected}"` })
}

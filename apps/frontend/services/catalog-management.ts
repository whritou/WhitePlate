import "server-only"
import { whitePlateApi } from "@/lib/api"
import { parseManagedCatalog } from "@/lib/validation/catalog-management"
import type { ApiResult } from "@/types/api"
import type {
  ArchiveInput,
  CategoryInput,
  CatalogResult,
  ManagedCatalog,
  ProductInput,
} from "@/types/catalog-management"

export async function getManagedCatalog(
  tenantId: string
): Promise<ApiResult<ManagedCatalog>> {
  const response = await whitePlateApi.get<unknown>(
    `/api/v1/tenants/${tenantId}/catalog`
  )

  if (!response.ok) return response

  const data = parseManagedCatalog(response.data, tenantId)

  return data
    ? { ok: true, status: 200, data }
    : { ok: false, status: 502, error: "unavailable" }
}

function mutationResult(response: ApiResult<unknown>): CatalogResult {
  if (response.ok) return { ok: true }

  const error = response.error === "not_found" ? "forbidden" : response.error

  return {
    ok: false,
    error:
      error === "unauthorized" ||
      error === "forbidden" ||
      error === "invalid" ||
      error === "conflict"
        ? error
        : "unavailable",
  }
}

export async function saveCategory({
  tenantId,
  id,
  name,
  sortOrder,
}: CategoryInput): Promise<CatalogResult> {
  const path = `/api/v1/tenants/${tenantId}/categories`
  const response = id
    ? await whitePlateApi.put(`${path}/${id}`, { name, sortOrder })
    : await whitePlateApi.post(path, { name, sortOrder })

  return mutationResult(response)
}

export async function saveProduct(input: ProductInput): Promise<CatalogResult> {
  const {
    tenantId,
    id,
    categoryId,
    name,
    description,
    basePrice,
    taxRatePercent,
    sortOrder,
    isAvailable,
  } = input
  const path = `/api/v1/tenants/${tenantId}/products`
  const fields = { name, description, basePrice, taxRatePercent, sortOrder }
  const response = id
    ? await whitePlateApi.put(`${path}/${id}`, { ...fields, isAvailable })
    : await whitePlateApi.post(path, { categoryId, ...fields })

  return mutationResult(response)
}

export async function archiveCatalogItem({
  tenantId,
  id,
  entityType,
}: ArchiveInput): Promise<CatalogResult> {
  return mutationResult(
    await whitePlateApi.delete(
      `/api/v1/tenants/${tenantId}/${entityType}/${id}`
    )
  )
}

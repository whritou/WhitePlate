import "server-only"
import { whitePlateApi } from "@/lib/api"
import { parseManagedCatalog } from "@/lib/validation/catalog-management"
import type { ApiResult } from "@/types/api"
import type { CategoryVisibilityInput } from "@/types/menu-builder"
import type {
  ArchiveInput,
  CategoryInput,
  CatalogResult,
  DiscountInput,
  DiscountReferenceInput,
  ManagedCatalog,
  OptionGroupInput,
  OptionInput,
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

export async function setCategoryVisibility({
  tenantId,
  id,
  isVisible,
}: CategoryVisibilityInput): Promise<CatalogResult> {
  return mutationResult(
    await whitePlateApi.put(
      `/api/v1/tenants/${tenantId}/categories/${id}/visibility`,
      { isVisible }
    )
  )
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

export async function saveOptionGroup({
  tenantId,
  id,
  productId,
  name,
  minimumSelections,
  maximumSelections,
  sortOrder,
}: OptionGroupInput): Promise<CatalogResult> {
  const fields = { name, minimumSelections, maximumSelections, sortOrder }
  const response = id
    ? await whitePlateApi.put(
        `/api/v1/tenants/${tenantId}/option-groups/${id}`,
        fields
      )
    : await whitePlateApi.post(
        `/api/v1/tenants/${tenantId}/products/${productId}/option-groups`,
        fields
      )

  return mutationResult(response)
}

export async function saveOption(input: OptionInput): Promise<CatalogResult> {
  const { tenantId, id, groupId, name, priceAdjustment, sortOrder } = input
  const fields = { name, priceAdjustment, sortOrder }
  const response = id
    ? await whitePlateApi.put(
        `/api/v1/tenants/${tenantId}/options/${id}`,
        fields
      )
    : await whitePlateApi.post(
        `/api/v1/tenants/${tenantId}/option-groups/${groupId}/options`,
        fields
      )

  return mutationResult(response)
}

export async function saveDiscount({
  tenantId,
  id,
  code,
  name,
  kind,
  value,
}: DiscountInput): Promise<CatalogResult> {
  const path = `/api/v1/tenants/${tenantId}/discounts`
  const fields = { name, kind, value }

  if (id)
    return mutationResult(await whitePlateApi.put(`${path}/${id}`, fields))

  if (!code) return { ok: false, error: "invalid" }

  return mutationResult(await whitePlateApi.post(path, { code, ...fields }))
}

export async function deactivateDiscount({
  tenantId,
  id,
}: DiscountReferenceInput): Promise<CatalogResult> {
  return mutationResult(
    await whitePlateApi.delete(`/api/v1/tenants/${tenantId}/discounts/${id}`)
  )
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

export async function restoreProduct(
  tenantId: string,
  id: string
): Promise<CatalogResult> {
  return mutationResult(
    await whitePlateApi.post(
      `/api/v1/tenants/${tenantId}/products/${id}/restore`,
      {}
    )
  )
}

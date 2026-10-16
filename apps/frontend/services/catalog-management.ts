import "server-only"
import { isRecord, isUuid } from "@/lib/validation/common"
import { whitePlateApi } from "@/lib/api"
import {
  parseManagedCatalog,
  parseCatalogHistory,
  parseProductAvailability,
} from "@/lib/validation/catalog-management"
import type { ApiResult } from "@/types/api"
import type { CategoryVisibilityInput } from "@/types/menu-builder"
import type {
  ArchiveInput,
  CatalogReorderInput,
  CatalogEntityType,
  CatalogHistory,
  CategoryInput,
  CatalogResult,
  DiscountInput,
  DiscountReferenceInput,
  ManagedCatalog,
  OptionGroupInput,
  OptionInput,
  ProductInput,
  ProductAvailability,
  ProductAvailabilityInput,
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

export async function getProductAvailability(
  tenantId: string
): Promise<ApiResult<ProductAvailability[]>> {
  const response = await whitePlateApi.get<unknown>(
    `/api/v1/tenants/${tenantId}/products/availability`
  )

  if (!response.ok) return response

  const data = parseProductAvailability(response.data)

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

export async function setProductAvailability({
  tenantId,
  id,
  isAvailable,
}: ProductAvailabilityInput): Promise<CatalogResult> {
  return mutationResult(
    await whitePlateApi.put(
      `/api/v1/tenants/${tenantId}/products/${id}/availability`,
      { isAvailable }
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

  if (
    !id &&
    response.ok &&
    typeof response.data === "object" &&
    response.data !== null &&
    "id" in response.data &&
    isUuid(response.data.id)
  ) {
    return {
      ok: true,
      category: {
        id: response.data.id,
        name,
        sortOrder,
        isVisible: true,
        isArchived: false,
        translations: {},
      },
    }
  }

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
    sku,
    containsAllergens,
    mayContainAllergens,
    dietaryTags,
    preparationMinutes,
    preparationNotes,
  } = input
  const path = `/api/v1/tenants/${tenantId}/products`
  const fields = {
    name,
    description,
    basePrice,
    taxRatePercent,
    sortOrder,
    sku,
    containsAllergens,
    mayContainAllergens,
    dietaryTags,
    preparationMinutes,
    preparationNotes,
  }
  const response = id
    ? await whitePlateApi.put(`${path}/${id}`, {
        categoryId,
        ...fields,
        isAvailable,
      })
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
  minimumOrderAmount,
  expiresOn,
}: DiscountInput): Promise<CatalogResult> {
  const path = `/api/v1/tenants/${tenantId}/discounts`
  const fields = { name, kind, value, minimumOrderAmount, expiresOn }

  if (id)
    return mutationResult(await whitePlateApi.put(`${path}/${id}`, fields))

  if (!code) return { ok: false, error: "invalid" }

  return mutationResult(await whitePlateApi.post(path, { code, ...fields }))
}

export async function reorderCatalog({
  tenantId,
  entityType,
  parentId,
  categoryId,
  orderedIds,
}: CatalogReorderInput): Promise<CatalogResult> {
  return mutationResult(
    await whitePlateApi.put(`/api/v1/tenants/${tenantId}/catalog/reorder`, {
      entityType,
      parentId: parentId ?? null,
      categoryId: categoryId ?? null,
      orderedIds,
    })
  )
}

export async function restoreCatalogItem({
  tenantId,
  id,
  entityType,
}: {
  tenantId: string
  id: string
  entityType: Exclude<CatalogEntityType, "products">
}): Promise<CatalogResult> {
  return mutationResult(
    await whitePlateApi.post(
      `/api/v1/tenants/${tenantId}/${entityType}/${id}/restore`,
      {}
    )
  )
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

export async function getCatalogHistory(
  tenantId: string,
  beforeVersion: number | null,
  pageSize: number,
  signal?: AbortSignal
): Promise<ApiResult<CatalogHistory>> {
  const query = new URLSearchParams({ pageSize: String(pageSize) })

  if (beforeVersion !== null) query.set("beforeVersion", String(beforeVersion))

  const response = await whitePlateApi.get<unknown>(
    `/api/v1/tenants/${tenantId}/catalog/history?${query}`,
    { signal }
  )

  if (!response.ok) return response

  const data = parseCatalogHistory(response.data)

  return data
    ? { ok: true, status: 200, data }
    : { ok: false, status: 502, error: "unavailable" }
}

function publicationMutationResult(
  response: ApiResult<unknown>
): CatalogResult {
  if (!response.ok) return mutationResult(response)
  if (
    !isRecord(response.data) ||
    !Number.isSafeInteger(response.data.publishedVersion) ||
    (response.data.publishedVersion as number) < 1 ||
    typeof response.data.publishedAt !== "string" ||
    Number.isNaN(Date.parse(response.data.publishedAt))
  )
    return { ok: false, error: "unavailable" }

  return {
    ok: true,
    publication: {
      publishedVersion: response.data.publishedVersion as number,
      publishedAt: response.data.publishedAt,
    },
  }
}

export async function publishCatalog(
  tenantId: string,
  expectedVersion: number
): Promise<CatalogResult> {
  const response = await whitePlateApi.post<unknown, Record<string, never>>(
    `/api/v1/tenants/${tenantId}/catalog/publish`,
    {},
    { ifMatch: `"${expectedVersion}"` }
  )

  return publicationMutationResult(response)
}

export async function discardCatalogDraft(
  tenantId: string,
  expectedVersion: number
): Promise<CatalogResult> {
  return mutationResult(
    await whitePlateApi.post<unknown, Record<string, never>>(
      `/api/v1/tenants/${tenantId}/catalog/discard`,
      {},
      { ifMatch: `"${expectedVersion}"` }
    )
  )
}

export async function restoreCatalogVersion(
  tenantId: string,
  expectedVersion: number,
  sourceVersion: number
): Promise<CatalogResult> {
  const response = await whitePlateApi.post<unknown, Record<string, never>>(
    `/api/v1/tenants/${tenantId}/catalog/history/${sourceVersion}/restore`,
    {},
    { ifMatch: `"${expectedVersion}"` }
  )

  return publicationMutationResult(response)
}

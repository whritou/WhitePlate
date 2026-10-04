import { isUuid } from "./common"
import type {
  ArchiveInput,
  CategoryInput,
  ProductInput,
} from "@/types/catalog-management"

function decimal(
  value: FormDataEntryValue | null,
  maximum: number
): number | null {
  if (typeof value !== "string" || !/^\d+(?:\.\d{1,2})?$/.test(value))
    return null

  const amount = Number(value)

  return Number.isFinite(amount) && amount <= maximum ? amount : null
}

function categoryFields(
  input: FormData,
  maximum: number
): CategoryInput | null {
  const tenantId = input.get("tenantId")
  const id = input.get("id")
  const rawName = input.get("name")
  const rawSort = input.get("sortOrder")

  if (
    !isUuid(tenantId) ||
    (id !== null && !isUuid(id)) ||
    typeof rawName !== "string" ||
    typeof rawSort !== "string" ||
    !/^\d+$/.test(rawSort)
  )
    return null

  const name = rawName.trim()
  const sortOrder = Number(rawSort)

  return name &&
    name.length <= maximum &&
    Number.isSafeInteger(sortOrder) &&
    sortOrder <= 2147483647
    ? { tenantId, id, name, sortOrder }
    : null
}

export function parseCategoryInput(input: unknown): CategoryInput | null {
  return input instanceof FormData ? categoryFields(input, 120) : null
}

export function parseProductInput(input: unknown): ProductInput | null {
  if (!(input instanceof FormData)) return null

  const category = categoryFields(input, 160)
  const categoryId = input.get("categoryId")
  const rawDescription = input.get("description")
  const basePrice = decimal(input.get("basePrice"), 9999999999.99)
  const taxRatePercent = decimal(input.get("taxRatePercent"), 100)
  const availability = input.get("isAvailable")

  if (
    !category ||
    !isUuid(categoryId) ||
    typeof rawDescription !== "string" ||
    rawDescription.trim().length > 1000 ||
    basePrice === null ||
    taxRatePercent === null ||
    (category.id !== null &&
      availability !== "true" &&
      availability !== "false")
  )
    return null

  return {
    ...category,
    categoryId,
    description: rawDescription.trim() || null,
    basePrice,
    taxRatePercent,
    isAvailable: category.id === null || availability === "true",
  }
}

export function parseArchiveInput(input: unknown): ArchiveInput | null {
  if (!(input instanceof FormData)) return null

  const tenantId = input.get("tenantId")
  const id = input.get("id")
  const entityType = input.get("entityType")

  return isUuid(tenantId) &&
    isUuid(id) &&
    (entityType === "categories" || entityType === "products")
    ? { tenantId, id, entityType }
    : null
}

import type { ManagedCatalog } from "@/types/catalog-management"
import { isRecord, isUuid } from "./common"
import { parseCatalog } from "./responses"

const isSortOrder = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isSafeInteger(value) &&
  value >= 0 &&
  value <= 2147483647
const isAmount = (value: unknown, maximum: number): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= maximum &&
  Math.abs(Math.round(value * 100) - value * 100) < 0.0001
const isSelectionBounds = (minimum: unknown, maximum: unknown): boolean =>
  typeof minimum === "number" &&
  Number.isSafeInteger(minimum) &&
  minimum >= 0 &&
  minimum <= 20 &&
  typeof maximum === "number" &&
  Number.isSafeInteger(maximum) &&
  maximum >= 1 &&
  maximum <= 20 &&
  minimum <= maximum

export function parseManagedCatalog(
  value: unknown,
  tenantId: string
): ManagedCatalog | null {
  const translated = parseCatalog(value)

  if (
    !translated ||
    !isRecord(value) ||
    !isUuid(value.tenantId) ||
    value.tenantId !== tenantId ||
    typeof value.currency !== "string" ||
    !/^[A-Z]{3}$/.test(value.currency)
  )
    return null

  const categories = value.categories as Record<string, unknown>[]
  const products = value.products as Record<string, unknown>[]
  const optionGroups = value.optionGroups as Record<string, unknown>[]
  const options = value.options as Record<string, unknown>[]
  const categoryIds = new Set(
    translated.categories.map((category) => category.id)
  )
  const productIds = new Set(translated.products.map((product) => product.id))
  const optionGroupIds = new Set(
    translated.optionGroups.map((group) => group.id)
  )

  if (
    !categories.every((category) => isSortOrder(category.sortOrder)) ||
    !products.every(
      (product) =>
        isSortOrder(product.sortOrder) &&
        isAmount(product.basePrice, 9999999999.99) &&
        isAmount(product.taxRatePercent, 100) &&
        typeof product.isAvailable === "boolean" &&
        categoryIds.has(product.categoryId as string)
    ) ||
    !optionGroups.every(
      (group) =>
        productIds.has(group.productId as string) &&
        isSelectionBounds(group.minimumSelections, group.maximumSelections) &&
        isSortOrder(group.sortOrder)
    ) ||
    !options.every(
      (option) =>
        optionGroupIds.has(option.groupId as string) &&
        isAmount(option.priceAdjustment, 9999999999.99) &&
        isSortOrder(option.sortOrder)
    )
  )
    return null

  return {
    tenantId,
    currency: value.currency,
    categories,
    products,
    optionGroups,
    options,
  } as ManagedCatalog
}

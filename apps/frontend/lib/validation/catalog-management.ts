import type {
  CatalogDiscount,
  ManagedCatalog,
  ProductAvailability,
} from "@/types/catalog-management"
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
const allergens = [
  "celery",
  "cerealsWithGluten",
  "crustaceans",
  "eggs",
  "fish",
  "lupin",
  "milk",
  "molluscs",
  "mustard",
  "nuts",
  "peanuts",
  "sesame",
  "soybeans",
  "sulphites",
]
const diets = ["dairyFree", "glutenFree", "pescatarian", "vegan", "vegetarian"]
const isCodeList = (value: unknown, supported: string[]) =>
  Array.isArray(value) &&
  value.length <= supported.length &&
  value.every((code) => typeof code === "string" && supported.includes(code))
const isPreparationNotes = (value: unknown) =>
  isRecord(value) &&
  Object.entries(value).every(
    ([locale, note]) =>
      /^[a-z0-9-]{2,16}$/i.test(locale) &&
      typeof note === "string" &&
      note.length <= 250
  )

function isProductMetadata(product: Record<string, unknown>): boolean {
  const contains = product.containsAllergens ?? []
  const mayContain = product.mayContainAllergens ?? []
  const minutes = product.preparationMinutes

  return (
    isCodeList(contains, allergens) &&
    isCodeList(mayContain, allergens) &&
    !(contains as string[]).some((code) =>
      (mayContain as string[]).includes(code)
    ) &&
    isCodeList(product.dietaryTags ?? [], diets) &&
    (minutes === undefined ||
      minutes === null ||
      (typeof minutes === "number" &&
        Number.isInteger(minutes) &&
        minutes >= 1 &&
        minutes <= 1440)) &&
    isPreparationNotes(product.preparationNotes ?? {})
  )
}

function areDiscountsValid(value: unknown): value is CatalogDiscount[] {
  return (
    Array.isArray(value) &&
    value.every(isDiscount) &&
    new Set(value.map((discount) => discount.id)).size === value.length &&
    new Set(value.map((discount) => discount.code)).size === value.length
  )
}

function isDiscount(value: unknown): value is CatalogDiscount {
  if (
    !isRecord(value) ||
    !isUuid(value.id) ||
    typeof value.code !== "string" ||
    !/^[A-Z0-9-]{1,32}$/.test(value.code) ||
    typeof value.name !== "string" ||
    !value.name.trim() ||
    value.name.length > 120 ||
    (value.kind !== "FixedAmount" && value.kind !== "Percentage") ||
    typeof value.value !== "number" ||
    !Number.isFinite(value.value) ||
    value.value <= 0 ||
    Math.abs(Math.round(value.value * 100) - value.value * 100) >= 0.0001 ||
    typeof value.isActive !== "boolean"
  )
    return false

  return value.kind === "Percentage"
    ? value.value <= 100
    : value.value <= 9999999999.99
}

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
  const discounts = value.discounts
  const categoryIds = new Set(
    translated.categories.map((category) => category.id)
  )
  const productIds = new Set(translated.products.map((product) => product.id))
  const optionGroupIds = new Set(
    translated.optionGroups.map((group) => group.id)
  )

  if (
    !categories.every(
      (category) =>
        isSortOrder(category.sortOrder) &&
        typeof category.isVisible === "boolean"
    ) ||
    !products.every(
      (product) =>
        isSortOrder(product.sortOrder) &&
        isAmount(product.basePrice, 9999999999.99) &&
        isAmount(product.taxRatePercent, 100) &&
        typeof product.isAvailable === "boolean" &&
        (product.sku === undefined ||
          product.sku === null ||
          (typeof product.sku === "string" &&
            /^[A-Z0-9._-]{1,64}$/.test(product.sku))) &&
        isProductMetadata(product) &&
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
    ) ||
    !areDiscountsValid(discounts)
  )
    return null

  return {
    tenantId,
    currency: value.currency,
    categories,
    products: products.map((product) => ({
      ...product,
      sku: product.sku ?? null,
      containsAllergens: product.containsAllergens ?? [],
      mayContainAllergens: product.mayContainAllergens ?? [],
      dietaryTags: product.dietaryTags ?? [],
      preparationMinutes: product.preparationMinutes ?? null,
      preparationNotes: product.preparationNotes ?? {},
    })) as ManagedCatalog["products"],
    optionGroups,
    options,
    discounts,
  } as ManagedCatalog
}

export function parseProductAvailability(
  value: unknown
): ProductAvailability[] | null {
  if (!Array.isArray(value)) return null

  const products: ProductAvailability[] = []
  const ids = new Set<string>()

  for (const candidate of value) {
    if (
      !isRecord(candidate) ||
      !isUuid(candidate.id) ||
      typeof candidate.name !== "string" ||
      candidate.name.trim().length === 0 ||
      candidate.name.length > 160 ||
      typeof candidate.isAvailable !== "boolean"
    )
      return null

    const id = candidate.id.toLowerCase()

    if (ids.has(id)) return null
    ids.add(id)
    products.push({
      id: candidate.id,
      name: candidate.name,
      isAvailable: candidate.isAvailable,
    })
  }

  return products
}

import type {
  CatalogChange,
  CatalogDiscount,
  CatalogHistory,
  CatalogHistoryRevision,
  CatalogPublicationSummary,
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
const isTimestamp = (value: unknown): value is string =>
  typeof value === "string" && !Number.isNaN(Date.parse(value))

function isCatalogChange(value: unknown): value is CatalogChange {
  return (
    isRecord(value) &&
    typeof value.entityType === "string" &&
    isUuid(value.entityId) &&
    typeof value.name === "string" &&
    (value.action === "added" ||
      value.action === "updated" ||
      value.action === "removed") &&
    Array.isArray(value.fields) &&
    value.fields.every(
      (field) =>
        isRecord(field) &&
        typeof field.field === "string" &&
        (field.before === null || typeof field.before === "string") &&
        (field.after === null || typeof field.after === "string")
    )
  )
}

function parsePublicationSummary(
  value: unknown
): CatalogPublicationSummary | null {
  if (
    !isRecord(value) ||
    !Number.isSafeInteger(value.publishedVersion) ||
    (value.publishedVersion as number) < 1 ||
    !isTimestamp(value.publishedAt) ||
    typeof value.hasUnpublishedChanges !== "boolean" ||
    !Number.isSafeInteger(value.changeCount) ||
    (value.changeCount as number) < 0 ||
    !Array.isArray(value.changes) ||
    !value.changes.every(isCatalogChange) ||
    value.changeCount !== value.changes.length
  )
    return null

  return value as unknown as CatalogPublicationSummary
}

function parseHistoryRevision(value: unknown): CatalogHistoryRevision | null {
  if (
    !isRecord(value) ||
    !Number.isSafeInteger(value.version) ||
    (value.version as number) < 1 ||
    !isTimestamp(value.publishedAt) ||
    !["baseline", "publish", "rollback", "availability"].includes(
      String(value.action)
    ) ||
    (value.sourceVersion !== null &&
      (!Number.isSafeInteger(value.sourceVersion) ||
        (value.sourceVersion as number) < 1)) ||
    typeof value.actorIssuer !== "string" ||
    typeof value.actorSubject !== "string" ||
    !Array.isArray(value.changes) ||
    !value.changes.every(isCatalogChange)
  )
    return null

  return value as unknown as CatalogHistoryRevision
}

export function parseCatalogHistory(value: unknown): CatalogHistory | null {
  if (
    !isRecord(value) ||
    !Number.isSafeInteger(value.currentVersion) ||
    (value.currentVersion as number) < 1 ||
    !Array.isArray(value.revisions)
  )
    return null

  const revisions = value.revisions.map(parseHistoryRevision)

  if (
    revisions.some((revision) => revision === null) ||
    revisions.some(
      (revision, index) =>
        index > 0 && revision!.version >= revisions[index - 1]!.version
    )
  )
    return null

  return {
    currentVersion: value.currentVersion as number,
    revisions: revisions as CatalogHistoryRevision[],
  }
}

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

function areManagedCatalogCollectionsValid(
  categories: Record<string, unknown>[],
  products: Record<string, unknown>[],
  optionGroups: Record<string, unknown>[],
  options: Record<string, unknown>[],
  discounts: unknown,
  categoryIds: Set<string>,
  productIds: Set<string>,
  optionGroupIds: Set<string>
): discounts is CatalogDiscount[] {
  return (
    categories.every(
      (category) =>
        isSortOrder(category.sortOrder) &&
        typeof category.isVisible === "boolean"
    ) &&
    products.every(
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
    ) &&
    optionGroups.every(
      (group) =>
        productIds.has(group.productId as string) &&
        isSelectionBounds(group.minimumSelections, group.maximumSelections) &&
        isSortOrder(group.sortOrder)
    ) &&
    options.every(
      (option) =>
        optionGroupIds.has(option.groupId as string) &&
        isAmount(option.priceAdjustment, 9999999999.99) &&
        isSortOrder(option.sortOrder)
    ) &&
    areDiscountsValid(discounts)
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

  const minimumOrderAmount = value.minimumOrderAmount ?? 0
  const expiresOn = value.expiresOn ?? null

  if (
    !isAmount(minimumOrderAmount, 9999999999.99) ||
    (expiresOn !== null &&
      (typeof expiresOn !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(expiresOn) ||
        Number.isNaN(Date.parse(`${expiresOn}T00:00:00.000Z`)) ||
        new Date(`${expiresOn}T00:00:00.000Z`).toISOString().slice(0, 10) !==
          expiresOn))
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

  const publication =
    value.publication === undefined || value.publication === null
      ? null
      : parsePublicationSummary(value.publication)

  if (
    value.publication !== undefined &&
    value.publication !== null &&
    !publication
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
    !areManagedCatalogCollectionsValid(
      categories,
      products,
      optionGroups,
      options,
      discounts,
      categoryIds,
      productIds,
      optionGroupIds
    )
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
    discounts: discounts.map((discount) => ({
      ...discount,
      minimumOrderAmount: discount.minimumOrderAmount ?? 0,
      expiresOn: discount.expiresOn ?? null,
    })),
    publication,
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

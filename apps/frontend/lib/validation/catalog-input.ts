import { isRecord, isUuid } from "./common"
import type {
  ArchiveInput,
  CategoryInput,
  DiscountInput,
  DiscountReferenceInput,
  OptionGroupInput,
  OptionInput,
  ProductAvailabilityInput,
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

const supportedAllergens = [
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
const supportedDiets = [
  "dairyFree",
  "glutenFree",
  "pescatarian",
  "vegan",
  "vegetarian",
]

function productMetadataFields(
  input: FormData
): Pick<
  ProductInput,
  | "sku"
  | "containsAllergens"
  | "mayContainAllergens"
  | "dietaryTags"
  | "preparationMinutes"
  | "preparationNotes"
> | null {
  const sku = input.get("sku") ?? ""
  const rawMinutes = input.get("preparationMinutes") ?? ""
  const preparationMinutes =
    rawMinutes === "" ? null : integer(rawMinutes, 1, 1440)
  const containsValues = input.getAll("containsAllergens")
  const mayContainValues = input.getAll("mayContainAllergens")
  const dietValues = input.getAll("dietaryTags")
  const containsAllergens = containsValues.filter(
    (value): value is string => typeof value === "string"
  )
  const mayContainAllergens = mayContainValues.filter(
    (value): value is string => typeof value === "string"
  )
  const dietaryTags = dietValues.filter(
    (value): value is string => typeof value === "string"
  )
  const preparationNotes = Object.fromEntries(
    ["en", "fr"].flatMap((locale) => {
      const note = input.get(`preparationNote-${locale}`)

      return typeof note === "string" && note.trim()
        ? [[locale, note.trim()]]
        : []
    })
  )

  if (
    typeof sku !== "string" ||
    (sku.trim() !== "" && !/^[a-zA-Z0-9._-]{1,64}$/.test(sku.trim())) ||
    (rawMinutes !== "" && preparationMinutes === null) ||
    containsValues.length !== containsAllergens.length ||
    containsAllergens.some((code) => !supportedAllergens.includes(code)) ||
    mayContainValues.length !== mayContainAllergens.length ||
    mayContainAllergens.some((code) => !supportedAllergens.includes(code)) ||
    containsAllergens.some((code) => mayContainAllergens.includes(code)) ||
    dietValues.length !== dietaryTags.length ||
    dietaryTags.some((code) => !supportedDiets.includes(code)) ||
    ["en", "fr"].some((locale) => {
      const note = input.get(`preparationNote-${locale}`)

      return note !== null && (typeof note !== "string" || note.length > 250)
    })
  )
    return null

  return {
    sku: sku.trim() || null,
    containsAllergens: [...new Set(containsAllergens)],
    mayContainAllergens: [...new Set(mayContainAllergens)],
    dietaryTags: [...new Set(dietaryTags)],
    preparationMinutes,
    preparationNotes,
  }
}

export function parseProductInput(input: unknown): ProductInput | null {
  if (!(input instanceof FormData)) return null

  const category = categoryFields(input, 160)
  const categoryId = input.get("categoryId")
  const rawDescription = input.get("description")
  const basePrice = decimal(input.get("basePrice"), 9999999999.99)
  const taxRatePercent = decimal(input.get("taxRatePercent"), 100)
  const availability = input.get("isAvailable")
  const metadata = productMetadataFields(input)

  if (
    !category ||
    !isUuid(categoryId) ||
    typeof rawDescription !== "string" ||
    rawDescription.trim().length > 1000 ||
    basePrice === null ||
    taxRatePercent === null ||
    !metadata ||
    (category.id !== null &&
      availability !== "true" &&
      availability !== "false")
  )
    return null

  return {
    ...category,
    ...metadata,
    categoryId,
    description: rawDescription.trim() || null,
    basePrice,
    taxRatePercent,
    isAvailable: category.id === null || availability === "true",
  }
}

export function parseProductAvailabilityInput(
  input: unknown
): ProductAvailabilityInput | null {
  const fields =
    input instanceof FormData
      ? {
          tenantId: input.get("tenantId"),
          id: input.get("id"),
          isAvailable: input.get("isAvailable"),
        }
      : isRecord(input)
        ? input
        : null

  if (!fields || !isUuid(fields.tenantId) || !isUuid(fields.id)) return null

  const isAvailable =
    fields.isAvailable === true || fields.isAvailable === "true"
      ? true
      : fields.isAvailable === false || fields.isAvailable === "false"
        ? false
        : null

  return isAvailable === null
    ? null
    : { tenantId: fields.tenantId, id: fields.id, isAvailable }
}

export function parseOptionGroupInput(input: unknown): OptionGroupInput | null {
  if (!(input instanceof FormData)) return null

  const tenantId = input.get("tenantId")
  const id = input.get("id")
  const productId = input.get("productId")
  const rawName = input.get("name")
  const minimumSelections = integer(input.get("minimumSelections"), 0, 20)
  const maximumSelections = integer(input.get("maximumSelections"), 1, 20)
  const sortOrder = integer(input.get("sortOrder"), 0, 2147483647)
  const name = typeof rawName === "string" ? rawName.trim() : ""

  if (
    !isUuid(tenantId) ||
    !isUuid(productId) ||
    (id !== null && !isUuid(id)) ||
    !name ||
    name.length > 120 ||
    minimumSelections === null ||
    maximumSelections === null ||
    minimumSelections > maximumSelections ||
    sortOrder === null
  )
    return null

  return {
    tenantId,
    id,
    productId,
    name,
    minimumSelections,
    maximumSelections,
    sortOrder,
  }
}

export function parseOptionInput(input: unknown): OptionInput | null {
  if (!(input instanceof FormData)) return null

  const tenantId = input.get("tenantId")
  const id = input.get("id")
  const groupId = input.get("groupId")
  const rawName = input.get("name")
  const priceAdjustment = decimal(input.get("priceAdjustment"), 9999999999.99)
  const sortOrder = integer(input.get("sortOrder"), 0, 2147483647)
  const name = typeof rawName === "string" ? rawName.trim() : ""

  if (
    !isUuid(tenantId) ||
    !isUuid(groupId) ||
    (id !== null && !isUuid(id)) ||
    !name ||
    name.length > 120 ||
    priceAdjustment === null ||
    sortOrder === null
  )
    return null

  return { tenantId, id, groupId, name, priceAdjustment, sortOrder }
}

export function parseDiscountInput(input: unknown): DiscountInput | null {
  if (!(input instanceof FormData)) return null

  const tenantId = input.get("tenantId")
  const id = input.get("id")
  const rawCode = input.get("code")
  const rawName = input.get("name")
  const rawKind = input.get("kind")
  const kind =
    rawKind === "FixedAmount" || rawKind === "Percentage" ? rawKind : null
  const maximum = kind === "Percentage" ? 100 : 9999999999.99
  const value = decimal(input.get("value"), maximum)
  const name = typeof rawName === "string" ? rawName.trim() : ""
  const code =
    id !== null
      ? null
      : typeof rawCode === "string" &&
          /^[A-Za-z0-9-]{1,32}$/.test(rawCode.trim())
        ? rawCode.trim().toUpperCase()
        : null

  if (
    !isUuid(tenantId) ||
    (id !== null && !isUuid(id)) ||
    (!id && !code) ||
    !name ||
    name.length > 120 ||
    !kind ||
    value === null ||
    value <= 0
  )
    return null

  return { tenantId, id, code, name, kind, value }
}

export function parseDiscountReferenceInput(
  input: unknown
): DiscountReferenceInput | null {
  if (!(input instanceof FormData)) return null

  const tenantId = input.get("tenantId")
  const id = input.get("id")

  return isUuid(tenantId) && isUuid(id) ? { tenantId, id } : null
}

function integer(
  value: FormDataEntryValue | null,
  minimum: number,
  maximum: number
): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null

  const result = Number(value)

  return Number.isSafeInteger(result) && result >= minimum && result <= maximum
    ? result
    : null
}

export function parseArchiveInput(input: unknown): ArchiveInput | null {
  if (!(input instanceof FormData)) return null

  const tenantId = input.get("tenantId")
  const id = input.get("id")
  const entityType = input.get("entityType")

  return isUuid(tenantId) &&
    isUuid(id) &&
    (entityType === "categories" ||
      entityType === "products" ||
      entityType === "option-groups" ||
      entityType === "options")
    ? { tenantId, id, entityType }
    : null
}

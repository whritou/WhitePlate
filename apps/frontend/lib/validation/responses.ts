import { isRecord, isUuid } from "./common"
import { parsePublicEstablishment } from "./establishment-settings"
import { parsePhotoList } from "@/lib/product-photos"
import { parseMenuLanguages } from "./organization"
import { isMenuProductMetadata } from "./menu-product"
import type { StorefrontMenu, Product } from "@/types/storefront"
import type {
  CatalogTranslationData,
  MenuLanguageSettings,
  RestaurantDescriptionTranslations,
  LocalizedText,
} from "@/types/catalog"
import type { Organization, Restaurant } from "@/types/organization"

const isAmount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0
const isDescription = (value: unknown): value is string | null =>
  value === null || typeof value === "string"

export function parseOrganizations(value: unknown): Organization[] | null {
  if (
    !Array.isArray(value) ||
    !value.every(
      (item) =>
        isRecord(item) &&
        isUuid(item.id) &&
        typeof item.name === "string" &&
        typeof item.isActive === "boolean"
    )
  )
    return null

  return value.map((item) => ({
    id: item.id,
    name: item.name,
    isActive: item.isActive,
    legalCountryCode:
      typeof item.legalCountryCode === "string" ? item.legalCountryCode : null,
    legalName: typeof item.legalName === "string" ? item.legalName : null,
    legalRegistrationNumber:
      typeof item.legalRegistrationNumber === "string"
        ? item.legalRegistrationNumber
        : null,
    taxIdentifier:
      typeof item.taxIdentifier === "string" ? item.taxIdentifier : null,
    legalProfileVersion:
      typeof item.legalProfileVersion === "number"
        ? item.legalProfileVersion
        : 1,
  }))
}

export function parseRestaurants(value: unknown): Restaurant[] | null {
  if (
    !Array.isArray(value) ||
    !value.every(
      (item) =>
        isRecord(item) &&
        isUuid(item.id) &&
        typeof item.name === "string" &&
        typeof item.subdomain === "string" &&
        typeof item.currency === "string"
    )
  )
    return null

  return value.map((item) => ({
    id: item.id,
    name: item.name,
    subdomain: item.subdomain,
    currency: item.currency,
  }))
}

export {
  parseOrganizationInvitations,
  parseOrganizationMembers,
  parseOrganizationRoleAssignmentOptions,
  parseOrganizationRoleGrant,
  parseOrganizationRoleGrants,
} from "./organization-responses"

export function parseMenuLanguageSettings(
  value: unknown
): MenuLanguageSettings | null {
  return parseMenuLanguages(value)
}

export function parseRestaurantDescriptionTranslations(
  value: unknown
): RestaurantDescriptionTranslations | null {
  if (
    !isRecord(value) ||
    !isUuid(value.tenantId) ||
    typeof value.defaultLocale !== "string" ||
    !Array.isArray(value.locales) ||
    value.locales.length === 0 ||
    !value.locales.every(
      (locale) => typeof locale === "string" && locale.length > 0
    )
  )
    return null

  const locales = value.locales as string[]

  if (
    !locales.includes(value.defaultLocale) ||
    !isRecord(value.translations) ||
    !Object.entries(value.translations).every(
      ([locale, description]) =>
        locale.length > 0 &&
        locale.length <= 255 &&
        typeof description === "string" &&
        description.length <= 500
    )
  )
    return null

  return {
    tenantId: value.tenantId,
    locales: [...locales],
    defaultLocale: value.defaultLocale,
    translations: { ...value.translations } as Record<string, string>,
  }
}

function isLocalizedText(value: unknown): value is LocalizedText {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    isDescription(value.description)
  )
}

function isTranslations(
  value: unknown
): value is Record<string, LocalizedText> {
  return isRecord(value) && Object.values(value).every(isLocalizedText)
}

function isCatalogItem(value: unknown): boolean {
  return (
    isRecord(value) &&
    isUuid(value.id) &&
    typeof value.name === "string" &&
    typeof value.isArchived === "boolean" &&
    isTranslations(value.translations)
  )
}

export function parseCatalog(value: unknown): CatalogTranslationData | null {
  if (
    !isRecord(value) ||
    ![
      value.categories,
      value.products,
      value.optionGroups,
      value.options,
    ].every((items) => Array.isArray(items) && items.every(isCatalogItem))
  )
    return null
  if (
    !(value.products as unknown[]).every(
      (item) =>
        isRecord(item) &&
        isUuid(item.categoryId) &&
        isDescription(item.description)
    ) ||
    !(value.optionGroups as unknown[]).every(
      (item) => isRecord(item) && isUuid(item.productId)
    ) ||
    !(value.options as unknown[]).every(
      (item) => isRecord(item) && isUuid(item.groupId)
    )
  )
    return null

  return {
    categories: value.categories,
    products: value.products,
    optionGroups: value.optionGroups,
    options: value.options,
  } as CatalogTranslationData
}

function isOptionGroup(value: unknown): boolean {
  return (
    isRecord(value) &&
    isUuid(value.id) &&
    typeof value.name === "string" &&
    isCount(value.minimumSelections) &&
    isCount(value.maximumSelections) &&
    value.minimumSelections <= value.maximumSelections &&
    Array.isArray(value.options) &&
    value.options.every(
      (item) =>
        isRecord(item) &&
        isUuid(item.id) &&
        typeof item.name === "string" &&
        isAmount(item.priceAdjustment)
    )
  )
}

function isProduct(value: unknown): value is Product {
  return (
    isRecord(value) &&
    isUuid(value.id) &&
    typeof value.name === "string" &&
    isDescription(value.description) &&
    isAmount(value.basePrice) &&
    typeof value.isAvailable === "boolean" &&
    isMenuProductMetadata(value) &&
    (value.photos === undefined || parsePhotoList(value.photos) !== null) &&
    Array.isArray(value.optionGroups) &&
    value.optionGroups.every(isOptionGroup)
  )
}

export function parseStorefrontMenu(value: unknown): StorefrontMenu | null {
  if (
    !isRecord(value) ||
    !isUuid(value.tenantId) ||
    typeof value.restaurantName !== "string" ||
    !isDescription(value.restaurantDescription) ||
    typeof value.currency !== "string" ||
    !/^[A-Z]{3}$/.test(value.currency) ||
    typeof value.locale !== "string" ||
    !parseMenuLanguages({
      tenantId: value.tenantId,
      locales: value.availableLocales,
      defaultLocale: value.defaultLocale,
    }) ||
    !(value.availableLocales as string[]).includes(value.locale) ||
    !Array.isArray(value.categories) ||
    !value.categories.every(
      (item) =>
        isRecord(item) &&
        isUuid(item.id) &&
        typeof item.name === "string" &&
        typeof item.sortOrder === "number" &&
        Number.isSafeInteger(item.sortOrder) &&
        Array.isArray(item.products) &&
        item.products.every(isProduct)
    )
  )
    return null

  return {
    tenantId: value.tenantId,
    restaurantName: value.restaurantName,
    restaurantDescription: value.restaurantDescription,
    ...(value.establishment !== undefined
      ? { establishment: parsePublicEstablishment(value.establishment) }
      : {}),
    currency: value.currency,
    locale: value.locale,
    defaultLocale: value.defaultLocale,
    availableLocales: value.availableLocales,
    categories: (value.categories as StorefrontMenu["categories"]).map(
      (category) => ({
        ...category,
        products: category.products.map((product) => ({
          ...product,
          containsAllergens: product.containsAllergens ?? [],
          mayContainAllergens: product.mayContainAllergens ?? [],
          dietaryTags: product.dietaryTags ?? [],
          preparationMinutes: product.preparationMinutes ?? null,
          preparationNotes: product.preparationNotes ?? {},
        })),
      })
    ),
  } as StorefrontMenu
}

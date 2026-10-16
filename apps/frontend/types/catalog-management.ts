import type { EditorCallbacks } from "./editor"
import type { CatalogTranslationData } from "./catalog"
import type { FormEvent } from "react"

export type CatalogCategory = CatalogTranslationData["categories"][number] & {
  sortOrder: number
  isVisible: boolean
}
export type CatalogProduct = CatalogTranslationData["products"][number] & {
  basePrice: number
  taxRatePercent: number
  sortOrder: number
  isAvailable: boolean
  sku?: string | null
  containsAllergens?: string[]
  mayContainAllergens?: string[]
  dietaryTags?: string[]
  preparationMinutes?: number | null
  preparationNotes?: Record<string, string>
}
export type ProductAvailability = {
  id: string
  name: string
  isAvailable: boolean
}
export type ProductAvailabilityControlLabels = {
  available: string
  unavailable: string
  markAvailable: string
  markUnavailable: string
  availabilityFor: string
  updating: string
  updated: string
  updateFailed: string
}
export type StorefrontShortcutLabels = {
  visitShop: string
  copyShopUrl: string
  copiedShopUrl: string
  copyShopUrlFailed: string
  showShopQr: string
  hideShopQr: string
  shopQrLabel: string
  shopUnavailable: string
}
export type CatalogOptionGroup =
  CatalogTranslationData["optionGroups"][number] & {
    minimumSelections: number
    maximumSelections: number
    sortOrder: number
  }
export type CatalogOption = CatalogTranslationData["options"][number] & {
  priceAdjustment: number
  sortOrder: number
}
export type CatalogDiscount = {
  id: string
  code: string
  name: string
  kind: "FixedAmount" | "Percentage"
  value: number
  minimumOrderAmount: number
  expiresOn: string | null
  isActive: boolean
}
export type CatalogFieldChange = {
  field: string
  before: string | null
  after: string | null
}
export type CatalogChange = {
  entityType: string
  entityId: string
  name: string
  action: "added" | "updated" | "removed"
  fields: CatalogFieldChange[]
}
export type CatalogPublicationSummary = {
  publishedVersion: number
  publishedAt: string
  hasUnpublishedChanges: boolean
  changeCount: number
  changes: CatalogChange[]
}
export type CatalogHistoryRevision = {
  version: number
  publishedAt: string
  action: string
  sourceVersion: number | null
  actorIssuer: string
  actorSubject: string
  changes: CatalogChange[]
}
export type CatalogHistory = {
  currentVersion: number
  revisions: CatalogHistoryRevision[]
}
export type CatalogPublicationResult = {
  publishedVersion: number
  publishedAt: string
}
export type PublicationConfirmAction =
  | { kind: "publish" }
  | { kind: "discard" }
  | { kind: "restore"; version: number }
export type CatalogPublicationInput = {
  tenantId: string
  expectedVersion: number
}
export type ManagedCatalog = {
  tenantId: string
  currency: string
  categories: CatalogCategory[]
  products: CatalogProduct[]
  optionGroups: CatalogOptionGroup[]
  options: CatalogOption[]
  discounts: CatalogDiscount[]
  publication: CatalogPublicationSummary | null
}
export type CatalogResult =
  | {
      ok: true
      category?: CatalogCategory
      publication?: CatalogPublicationResult
    }
  | {
      ok: false
      error:
        "unauthorized" | "forbidden" | "invalid" | "conflict" | "unavailable"
    }
export type CategoryInput = {
  tenantId: string
  id: string | null
  name: string
  sortOrder: number
}
export type ProductInput = CategoryInput & {
  categoryId: string
  description: string | null
  basePrice: number
  taxRatePercent: number
  isAvailable: boolean
  sku: string | null
  containsAllergens: string[]
  mayContainAllergens: string[]
  dietaryTags: string[]
  preparationMinutes: number | null
  preparationNotes: Record<string, string>
}
export type ProductAvailabilityInput = {
  tenantId: string
  id: string
  isAvailable: boolean
}
export type OptionGroupInput = {
  tenantId: string
  id: string | null
  productId: string
  name: string
  minimumSelections: number
  maximumSelections: number
  sortOrder: number
}
export type OptionInput = {
  tenantId: string
  id: string | null
  groupId: string
  name: string
  priceAdjustment: number
  sortOrder: number
}
export type DiscountInput = {
  tenantId: string
  id: string | null
  code: string | null
  name: string
  kind: CatalogDiscount["kind"]
  value: number
  minimumOrderAmount: number
  expiresOn: string | null
}
export type CatalogReorderInput = {
  tenantId: string
  entityType: CatalogEntityType
  parentId?: string | null
  categoryId?: string | null
  orderedIds: string[]
}
export type DiscountReferenceInput = { tenantId: string; id: string }
export type CatalogEntityType =
  "categories" | "products" | "option-groups" | "options"
export type ArchiveInput = {
  tenantId: string
  id: string
  entityType: CatalogEntityType
}
export type CatalogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}
export type CategoryFormProps = EditorCallbacks & {
  tenantId: string
  category?: CatalogCategory
  onCreated?: (category: CatalogCategory) => void
}
export type ProductFormProps = EditorCallbacks & {
  action?: CatalogFormAction
  onDirtyChange?: () => void
  formId?: string
  showActions?: boolean
  semanticForm?: boolean
  studio?: boolean
  tenantId: string
  currency: string
  categories: CatalogCategory[]
  product?: CatalogProduct
}
export type OptionGroupFormProps = EditorCallbacks & {
  tenantId: string
  productId: string
  productName: string
  group?: CatalogOptionGroup
}
export type OptionFormProps = EditorCallbacks & {
  tenantId: string
  currency: string
  group: CatalogOptionGroup
  option?: CatalogOption
}
export type OptionGroupsEditorProps = {
  studio?: boolean
  tenantId: string
  currency: string
  productId: string
  productName: string
  optionGroups: CatalogOptionGroup[]
  options: CatalogOption[]
  parentArchived: boolean
}
export type DiscountFormProps = EditorCallbacks & {
  tenantId: string
  currency: string
  discount?: CatalogDiscount
}
export type DiscountsEditorProps = {
  tenantId: string
  currency: string
  discounts: CatalogDiscount[]
}
export type ArchiveButtonProps = ArchiveInput & {
  name: string
  compact?: boolean
  disabled?: boolean
  removeIcon?: boolean
  open?: boolean
  hideTrigger?: boolean
  onOpenChange?: (open: boolean) => void
  onPendingChange?: (pending: boolean) => void
}
export type CatalogSubmit = (event: FormEvent<HTMLFormElement>) => void
export type CatalogFormAction = (input: FormData) => Promise<CatalogResult>

import type { EditorCallbacks } from "./editor"
import type { CatalogTranslationData } from "./catalog"
import type { FormEvent } from "react"

export type CatalogCategory = CatalogTranslationData["categories"][number] & {
  sortOrder: number
}
export type CatalogProduct = CatalogTranslationData["products"][number] & {
  basePrice: number
  taxRatePercent: number
  sortOrder: number
  isAvailable: boolean
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
  isActive: boolean
}
export type ManagedCatalog = {
  tenantId: string
  currency: string
  categories: CatalogCategory[]
  products: CatalogProduct[]
  optionGroups: CatalogOptionGroup[]
  options: CatalogOption[]
  discounts: CatalogDiscount[]
}
export type CatalogResult =
  | { ok: true }
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
}
export type DiscountReferenceInput = { tenantId: string; id: string }
export type CatalogEntityType =
  "categories" | "products" | "option-groups" | "options"
export type ArchiveInput = {
  tenantId: string
  id: string
  entityType: CatalogEntityType
}
export type CatalogPageProps = { searchParams: Promise<{ tenantId?: string }> }
export type CategoryFormProps = EditorCallbacks & {
  tenantId: string
  category?: CatalogCategory
}
export type ProductFormProps = EditorCallbacks & {
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
export type ArchiveButtonProps = ArchiveInput & { name: string }
export type CatalogSubmit = (event: FormEvent<HTMLFormElement>) => void
export type CatalogFormAction = (input: FormData) => Promise<CatalogResult>

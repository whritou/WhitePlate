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
export type ManagedCatalog = {
  tenantId: string
  currency: string
  categories: CatalogCategory[]
  products: CatalogProduct[]
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
export type ArchiveInput = {
  tenantId: string
  id: string
  entityType: "categories" | "products"
}
export type CatalogPageProps = { searchParams: Promise<{ tenantId?: string }> }
export type CategoryFormProps = { tenantId: string; category?: CatalogCategory }
export type ProductFormProps = {
  tenantId: string
  currency: string
  categories: CatalogCategory[]
  product?: CatalogProduct
}
export type ArchiveButtonProps = ArchiveInput & { name: string }
export type CatalogSubmit = (event: FormEvent<HTMLFormElement>) => void
export type CatalogFormAction = (input: FormData) => Promise<CatalogResult>

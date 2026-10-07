"use server"
import { isUuid } from "@/lib/validation/common"

import {
  parseArchiveInput,
  parseCategoryInput,
  parseDiscountInput,
  parseDiscountReferenceInput,
  parseOptionGroupInput,
  parseOptionInput,
  parseProductInput,
} from "@/lib/validation/catalog-input"
import {
  archiveCatalogItem,
  saveCategory,
  deactivateDiscount,
  saveDiscount,
  saveOption,
  saveOptionGroup,
  saveProduct,
  restoreProduct,
} from "@/services/catalog-management"
import type { CatalogResult } from "@/types/catalog-management"

export async function saveCategoryAction(
  input: unknown
): Promise<CatalogResult> {
  const parsed = parseCategoryInput(input)

  return parsed ? saveCategory(parsed) : { ok: false, error: "invalid" }
}

export async function saveProductAction(
  input: unknown
): Promise<CatalogResult> {
  const parsed = parseProductInput(input)

  return parsed ? saveProduct(parsed) : { ok: false, error: "invalid" }
}

export async function saveOptionGroupAction(
  input: unknown
): Promise<CatalogResult> {
  const parsed = parseOptionGroupInput(input)

  return parsed ? saveOptionGroup(parsed) : { ok: false, error: "invalid" }
}

export async function saveOptionAction(input: unknown): Promise<CatalogResult> {
  const parsed = parseOptionInput(input)

  return parsed ? saveOption(parsed) : { ok: false, error: "invalid" }
}

export async function saveDiscountAction(
  input: unknown
): Promise<CatalogResult> {
  const parsed = parseDiscountInput(input)

  return parsed ? saveDiscount(parsed) : { ok: false, error: "invalid" }
}

export async function deactivateDiscountAction(
  input: unknown
): Promise<CatalogResult> {
  const parsed = parseDiscountReferenceInput(input)

  return parsed ? deactivateDiscount(parsed) : { ok: false, error: "invalid" }
}

export async function archiveCatalogItemAction(
  input: unknown
): Promise<CatalogResult> {
  const parsed = parseArchiveInput(input)

  return parsed ? archiveCatalogItem(parsed) : { ok: false, error: "invalid" }
}

export async function restoreProductAction(
  input: unknown
): Promise<CatalogResult> {
  const tenantId = input instanceof FormData ? input.get("tenantId") : null
  const id = input instanceof FormData ? input.get("id") : null

  return isUuid(tenantId) && isUuid(id)
    ? restoreProduct(tenantId, id)
    : { ok: false, error: "invalid" }
}

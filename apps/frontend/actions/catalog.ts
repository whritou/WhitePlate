"use server"

import {
  parseArchiveInput,
  parseCategoryInput,
  parseOptionGroupInput,
  parseOptionInput,
  parseProductInput,
} from "@/lib/validation/catalog-input"
import {
  archiveCatalogItem,
  saveCategory,
  saveOption,
  saveOptionGroup,
  saveProduct,
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

export async function archiveCatalogItemAction(
  input: unknown
): Promise<CatalogResult> {
  const parsed = parseArchiveInput(input)

  return parsed ? archiveCatalogItem(parsed) : { ok: false, error: "invalid" }
}

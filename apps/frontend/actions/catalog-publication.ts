"use server"

import { isRecord, isUuid } from "@/lib/validation/common"
import {
  discardCatalogDraft,
  publishCatalog,
  restoreCatalogVersion,
} from "@/services/catalog-management"
import type {
  CatalogPublicationInput,
  CatalogResult,
} from "@/types/catalog-management"

function parseInput(value: unknown): CatalogPublicationInput | null {
  if (
    !isRecord(value) ||
    !isUuid(value.tenantId) ||
    !Number.isSafeInteger(value.expectedVersion) ||
    (value.expectedVersion as number) < 1
  )
    return null

  return {
    tenantId: value.tenantId,
    expectedVersion: value.expectedVersion as number,
  }
}

export async function publishCatalogAction(
  value: unknown
): Promise<CatalogResult> {
  const input = parseInput(value)

  return input
    ? publishCatalog(input.tenantId, input.expectedVersion)
    : { ok: false, error: "invalid" }
}

export async function discardCatalogDraftAction(
  value: unknown
): Promise<CatalogResult> {
  const input = parseInput(value)

  return input
    ? discardCatalogDraft(input.tenantId, input.expectedVersion)
    : { ok: false, error: "invalid" }
}

export async function restoreCatalogVersionAction(
  value: unknown
): Promise<CatalogResult> {
  if (!isRecord(value)) return { ok: false, error: "invalid" }

  const input = parseInput(value)
  const sourceVersion = value.sourceVersion

  return input &&
    Number.isSafeInteger(sourceVersion) &&
    (sourceVersion as number) > 0
    ? restoreCatalogVersion(
        input.tenantId,
        input.expectedVersion,
        sourceVersion as number
      )
    : { ok: false, error: "invalid" }
}

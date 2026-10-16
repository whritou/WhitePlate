import { isRecord, isUuid } from "./common"
import type {
  CatalogTranslationGlossaryTerm,
  CatalogTranslationReview,
  CatalogTranslationReviewStatus,
} from "@/types/catalog-translation-workflow"

const entityTypes = ["categories", "products", "option-groups", "options"]
const reviewStatuses: CatalogTranslationReviewStatus[] = [
  "Pending",
  "Approved",
  "Rejected",
  "Stale",
  "Superseded",
]

const isTimestamp = (value: unknown): value is string =>
  typeof value === "string" && !Number.isNaN(Date.parse(value))

const isOptionalText = (value: unknown): value is string | null =>
  value === null || typeof value === "string"

export function parseCatalogTranslationReviews(
  value: unknown
): CatalogTranslationReview[] | null {
  if (!Array.isArray(value)) return null

  const reviews: CatalogTranslationReview[] = []

  for (const candidate of value) {
    if (
      !isRecord(candidate) ||
      !isUuid(candidate.id) ||
      typeof candidate.entityType !== "string" ||
      !entityTypes.includes(candidate.entityType) ||
      !isUuid(candidate.entityId) ||
      typeof candidate.locale !== "string" ||
      !candidate.locale.trim() ||
      typeof candidate.name !== "string" ||
      !candidate.name.trim() ||
      !isOptionalText(candidate.description) ||
      typeof candidate.sourceName !== "string" ||
      !candidate.sourceName.trim() ||
      !isOptionalText(candidate.sourceDescription) ||
      !Number.isSafeInteger(candidate.version) ||
      (candidate.version as number) < 1 ||
      typeof candidate.status !== "string" ||
      !reviewStatuses.includes(
        candidate.status as CatalogTranslationReviewStatus
      ) ||
      typeof candidate.canReview !== "boolean" ||
      !Array.isArray(candidate.glossaryWarnings) ||
      !candidate.glossaryWarnings.every(
        (term) => typeof term === "string" && term.trim().length > 0
      ) ||
      !isTimestamp(candidate.createdAt)
    )
      return null

    reviews.push(candidate as unknown as CatalogTranslationReview)
  }

  return reviews
}

export function parseCatalogTranslationGlossary(
  value: unknown
): CatalogTranslationGlossaryTerm[] | null {
  if (!Array.isArray(value)) return null

  const terms: CatalogTranslationGlossaryTerm[] = []

  for (const candidate of value) {
    if (
      !isRecord(candidate) ||
      !isUuid(candidate.id) ||
      typeof candidate.sourceLocale !== "string" ||
      !candidate.sourceLocale.trim() ||
      typeof candidate.targetLocale !== "string" ||
      !candidate.targetLocale.trim() ||
      candidate.sourceLocale.toLowerCase() ===
        candidate.targetLocale.toLowerCase() ||
      typeof candidate.sourceTerm !== "string" ||
      !candidate.sourceTerm.trim() ||
      candidate.sourceTerm.length > 120 ||
      typeof candidate.targetTerm !== "string" ||
      !candidate.targetTerm.trim() ||
      candidate.targetTerm.length > 120 ||
      !isTimestamp(candidate.createdAt) ||
      !isTimestamp(candidate.updatedAt)
    )
      return null

    terms.push(candidate as unknown as CatalogTranslationGlossaryTerm)
  }

  return terms
}

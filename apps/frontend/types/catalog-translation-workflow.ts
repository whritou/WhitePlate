export type CatalogTranslationReviewStatus =
  "Pending" | "Approved" | "Rejected" | "Stale" | "Superseded"

export type CatalogTranslationReview = {
  id: string
  entityType: "categories" | "products" | "option-groups" | "options"
  entityId: string
  locale: string
  name: string
  description: string | null
  sourceName: string
  sourceDescription: string | null
  version: number
  status: CatalogTranslationReviewStatus
  canReview: boolean
  glossaryWarnings: string[]
  createdAt: string
}

export type CatalogTranslationGlossaryTerm = {
  id: string
  sourceLocale: string
  targetLocale: string
  sourceTerm: string
  targetTerm: string
  createdAt: string
  updatedAt: string
}

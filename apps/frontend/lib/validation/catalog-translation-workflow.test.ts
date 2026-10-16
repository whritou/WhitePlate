import { expect, it } from "vitest"
import {
  parseCatalogTranslationGlossary,
  parseCatalogTranslationReviews,
} from "./catalog-translation-workflow"

const id = "11111111-1111-4111-8111-111111111111"

it("parses a pending human review and preserves its author review restriction", () => {
  expect(
    parseCatalogTranslationReviews([
      {
        id,
        entityType: "products",
        entityId: id,
        locale: "fr",
        name: "Soupe",
        description: "Soupe fraîche",
        sourceName: "Soup",
        sourceDescription: "Fresh soup",
        version: 1,
        status: "Pending",
        canReview: false,
        glossaryWarnings: ["soup"],
        createdAt: "2026-10-17T10:00:00Z",
      },
    ])
  ).toEqual([
    {
      id,
      entityType: "products",
      entityId: id,
      locale: "fr",
      name: "Soupe",
      description: "Soupe fraîche",
      sourceName: "Soup",
      sourceDescription: "Fresh soup",
      version: 1,
      status: "Pending",
      canReview: false,
      glossaryWarnings: ["soup"],
      createdAt: "2026-10-17T10:00:00Z",
    },
  ])
})

it("rejects malformed review fields instead of hiding an unsafe author restriction", () => {
  expect(
    parseCatalogTranslationReviews([
      {
        id,
        entityType: "products",
        entityId: id,
        locale: "fr",
        name: "Soupe",
        description: null,
        sourceName: "Soup",
        sourceDescription: null,
        version: 1,
        status: "Pending",
        canReview: "false",
        glossaryWarnings: [],
        createdAt: "2026-10-17T10:00:00Z",
      },
    ])
  ).toBeNull()
})

it("parses glossary terms and rejects a malformed tenant-scoped record", () => {
  const term = {
    id,
    sourceLocale: "en",
    targetLocale: "fr",
    sourceTerm: "sourdough",
    targetTerm: "levain",
    createdAt: "2026-10-17T10:00:00Z",
    updatedAt: "2026-10-17T10:00:00Z",
  }

  expect(parseCatalogTranslationGlossary([term])).toEqual([term])
  expect(
    parseCatalogTranslationGlossary([{ ...term, targetLocale: "en" }])
  ).toBeNull()
})

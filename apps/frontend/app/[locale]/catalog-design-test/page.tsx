import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { CatalogWorkspace } from "@/components/organization/catalog-workspace"
import { MenuLanguageSettings } from "@/components/organization/menu-language-settings"
import { CatalogTranslationsEditor } from "@/components/organization/catalog-translations-editor"
import { MenuBuilderWorkspace } from "@/components/organization/menu-builder-workspace"
import type { ManagedCatalog } from "@/types/catalog-management"
import { WorkspaceShell } from "@/components/organization/workspace-shell"
import { FixtureReady } from "./ready"

export const dynamic = "force-dynamic"

const catalog: ManagedCatalog = {
  tenantId: "11111111-1111-4111-8111-111111111111",
  currency: "EUR",
  categories: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      name: "Les entrées",
      sortOrder: 0,
      isVisible: true,
      isArchived: false,
      translations: { fr: { name: "Les entrées", description: null } },
    },
    {
      id: "22222222-2222-4222-8222-333333333333",
      name: "Ancienne carte",
      sortOrder: 1,
      isVisible: true,
      isArchived: true,
      translations: {},
    },
  ],
  products: [
    {
      id: "33333333-3333-4333-8333-333333333333",
      categoryId: "22222222-2222-4222-8222-222222222222",
      name: "Soupe du potager",
      description: "Légumes de saison et herbes fraîches.",
      basePrice: 8.5,
      taxRatePercent: 10,
      sortOrder: 0,
      isAvailable: true,
      isArchived: false,
      translations: {
        fr: {
          name: "Soupe du potager",
          description: "Légumes de saison et herbes fraîches.",
        },
        en: {
          name: "Garden soup",
          description: "Seasonal vegetables and fresh herbs.",
        },
      },
    },
    {
      id: "33333333-3333-4333-8333-444444444444",
      categoryId: "22222222-2222-4222-8222-222222222222",
      name: "Salade de tomates anciennes et burrata",
      description: null,
      basePrice: 12,
      taxRatePercent: 10,
      sortOrder: 1,
      isAvailable: false,
      isArchived: false,
      translations: {},
    },
    {
      id: "33333333-3333-4333-8333-555555555555",
      categoryId: "22222222-2222-4222-8222-222222222222",
      name: "Velouté d’hiver",
      description: null,
      basePrice: 9,
      taxRatePercent: 10,
      sortOrder: 2,
      isAvailable: false,
      isArchived: true,
      translations: {},
    },
    {
      id: "33333333-3333-4333-8333-666666666666",
      categoryId: "22222222-2222-4222-8222-333333333333",
      name: "Produit de la catégorie archivée",
      description: null,
      basePrice: 9,
      taxRatePercent: 10,
      sortOrder: 2,
      isAvailable: true,
      isArchived: false,
      translations: {},
    },
  ],
  optionGroups: [
    {
      id: "44444444-4444-4444-8444-444444444444",
      productId: "33333333-3333-4333-8333-333333333333",
      name: "Accompagnement",
      minimumSelections: 0,
      maximumSelections: 1,
      sortOrder: 0,
      isArchived: false,
      translations: {},
    },
    {
      id: "44444444-4444-4444-8444-555555555555",
      productId: "33333333-3333-4333-8333-333333333333",
      name: "Anciennes options",
      minimumSelections: 0,
      maximumSelections: 1,
      sortOrder: 1,
      isArchived: true,
      translations: {},
    },
  ],
  options: [
    {
      id: "55555555-5555-4555-8555-555555555555",
      groupId: "44444444-4444-4444-8444-444444444444",
      name: "Pain au levain",
      priceAdjustment: 1.5,
      sortOrder: 0,
      isArchived: false,
      translations: {},
    },
  ],
  discounts: [
    {
      id: "66666666-6666-4666-8666-666666666666",
      code: "BIENVENUE",
      name: "Première commande",
      kind: "Percentage",
      value: 10,
      isActive: true,
    },
    {
      id: "66666666-6666-4666-8666-777777777777",
      code: "ANCIEN",
      name: "Ancienne offre",
      kind: "FixedAmount",
      value: 2.5,
      isActive: false,
    },
  ],
}

export default async function CatalogDesignTestPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; shell?: string; empty?: string }>
}) {
  if (process.env.NODE_ENV !== "development") notFound()

  const query = await searchParams
  const t = await getTranslations("Auth")
  const c = await getTranslations("Catalog")

  const content = (
    <main className="mx-auto grid w-full max-w-7xl min-w-0 gap-6 p-4 sm:p-6 lg:p-8">
      <FixtureReady />

      {!["builder", "products", "categories", "translations"].includes(
        query.view ?? ""
      ) && (
        <header>
          <p className="text-sm font-medium text-brand-text">
            Bistro du Potager
          </p>

          <h1 className="mt-2 text-2xl font-semibold sm:text-[2rem]">
            {query.view === "languages" ? t("menuLanguagesTitle") : c("title")}
          </h1>
        </header>
      )}

      {["builder", "products", "categories", "translations"].includes(
        query.view ?? ""
      ) ? (
        <MenuBuilderWorkspace
          catalog={
            query.empty === "1"
              ? {
                  ...catalog,
                  categories: [],
                  products: [],
                  optionGroups: [],
                  options: [],
                }
              : catalog
          }
          restaurantName="Bistro du Potager"
          settings={{
            tenantId: catalog.tenantId,
            locales: ["fr", "en"],
            defaultLocale: "fr",
          }}
          description={{
            tenantId: catalog.tenantId,
            locales: ["fr", "en"],
            defaultLocale: "fr",
            translations: { fr: "Cuisine de saison" },
          }}
          initialView={
            query.view === "categories"
              ? "categories"
              : query.view === "translations"
                ? "translations"
                : "products"
          }
        />
      ) : query.view === "languages" ? (
        <>
          <MenuLanguageSettings
            tenantId={catalog.tenantId}
            locales={["fr", "en"]}
            defaultLocale="fr"
          />

          <CatalogTranslationsEditor
            tenantId={catalog.tenantId}
            locales={["fr", "en"]}
            defaultLocale="fr"
            catalog={catalog}
          />
        </>
      ) : (
        <CatalogWorkspace catalog={catalog} />
      )}
    </main>
  )

  return query.shell === "1" ? (
    <WorkspaceShell
      organizations={[]}
      restaurants={[
        {
          id: catalog.tenantId,
          name: "Bistro du Potager",
          role: "OrganizationOwner",
        },
      ]}
    >
      {content}
    </WorkspaceShell>
  ) : (
    content
  )
}

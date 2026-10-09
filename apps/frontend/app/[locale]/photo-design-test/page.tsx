import { notFound } from "next/navigation"
import { MenuBuilderWorkspace } from "@/components/organization/menu-builder-workspace"
import { WorkspaceShell } from "@/components/organization/workspace-shell"
import { FixtureReady } from "../catalog-design-test/ready"
import type { ManagedCatalog } from "@/types/catalog-management"

export const dynamic = "force-dynamic"

export default function PhotoDesignFixture() {
  if (process.env.NODE_ENV !== "development") notFound()

  const tenantId = "11111111-1111-4111-8111-111111111111"
  const categoryId = "55555555-5555-4555-8555-555555555555"
  const productId = "22222222-2222-4222-8222-222222222222"
  const groupId = "66666666-6666-4666-8666-666666666666"
  const catalog: ManagedCatalog = {
    tenantId,
    currency: "EUR",
    categories: [
      {
        id: categoryId,
        name: "Burgers Gourmet",
        sortOrder: 0,
        isVisible: true,
        isArchived: false,
        translations: {},
      },
    ],
    products: [
      {
        id: productId,
        categoryId,
        name: "Burger Le Rustique Truffé",
        description:
          "Bœuf Charolais, crème de truffe noire, Morbier et oignons confits.",
        basePrice: 18.5,
        taxRatePercent: 10,
        sortOrder: 0,
        isAvailable: true,
        isArchived: false,
        translations: {},
      },
    ],
    optionGroups: [
      {
        id: groupId,
        productId,
        name: "Cuisson de la viande",
        minimumSelections: 1,
        maximumSelections: 1,
        sortOrder: 0,
        isArchived: false,
        translations: {},
      },
    ],
    options: [
      {
        id: "77777777-7777-4777-8777-777777777777",
        groupId,
        name: "À point",
        priceAdjustment: 0,
        sortOrder: 0,
        isArchived: false,
        translations: {},
      },
    ],
    discounts: [],
  }

  return (
    <WorkspaceShell
      organizations={[]}
      restaurants={[
        { id: tenantId, name: "Bistro Madeleine", role: "OrganizationOwner" },
      ]}
    >
      <main className="mx-auto w-full max-w-[100rem] min-w-0 p-4 sm:p-6 lg:p-8">
        <FixtureReady />

        <MenuBuilderWorkspace
          userId="photo-design-fixture"
          catalog={catalog}
          restaurantName="Bistro Madeleine"
        />
      </main>
    </WorkspaceShell>
  )
}

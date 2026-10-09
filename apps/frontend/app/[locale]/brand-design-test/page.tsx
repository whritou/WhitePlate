import { notFound } from "next/navigation"
import { BrandAssetsWorkspace } from "@/components/organization/brand-assets-workspace"
import { WorkspaceShell } from "@/components/organization/workspace-shell"
import { FixtureReady } from "../catalog-design-test/ready"

export const dynamic = "force-dynamic"

export default function BrandDesignFixture() {
  if (process.env.NODE_ENV !== "development") notFound()

  const tenantId = "11111111-1111-4111-8111-111111111111"

  return (
    <WorkspaceShell
      organizations={[]}
      restaurants={[
        { id: tenantId, name: "Bistro Madeleine", role: "OrganizationOwner" },
      ]}
    >
      <main className="mx-auto w-full max-w-[100rem] min-w-0 p-4 sm:p-6 lg:p-8">
        <FixtureReady />

        <BrandAssetsWorkspace
          userId="design-fixture"
          tenantId={tenantId}
          restaurantName="Bistro Madeleine"
          initialData={{ storageAvailable: true, assets: [] }}
        />
      </main>
    </WorkspaceShell>
  )
}

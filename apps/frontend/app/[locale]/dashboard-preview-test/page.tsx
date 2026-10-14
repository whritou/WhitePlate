import { notFound } from "next/navigation"
import { WorkspaceShell } from "@/components/organization/workspace-shell"
import { DashboardReviewPreview } from "@/components/organization/dashboard-review-preview"

export const dynamic = "force-dynamic"

const organization = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Maison Verte",
  isActive: true,
}
const tenantId = "22222222-2222-4222-8222-222222222222"

export default function DashboardPreviewTestPage() {
  if (process.env.NODE_ENV === "production") notFound()

  return (
    <WorkspaceShell
      organizations={[organization]}
      restaurants={[
        {
          id: tenantId,
          name: organization.name,
          role: "Manager",
          organizationId: organization.id,
          subdomain: "maisonverte",
        },
      ]}
    >
      <DashboardReviewPreview />
    </WorkspaceShell>
  )
}

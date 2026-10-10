import { WorkspaceShell } from "@/components/organization/workspace-shell"
import { notFound } from "next/navigation"
import { OrderKanbanTestHarness } from "@/components/orders/order-kanban-test-harness"

export const dynamic = "force-dynamic"

export default async function OrdersKanbanTestPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>
}) {
  if (process.env.NODE_ENV !== "development") notFound()

  const { role } = await searchParams

  return (
    <WorkspaceShell
      organizations={[
        {
          id: "11111111-1111-4111-8111-111111111111",
          name: "Maison Verte",
          isActive: true,
        },
      ]}
      restaurants={[
        {
          id: "33333333-3333-4333-8333-333333333333",
          name: "Maison Verte",
          role: "Manager",
          organizationId: "11111111-1111-4111-8111-111111111111",
          subdomain: "maisonverte",
        },
      ]}
    >
      <OrderKanbanTestHarness
        role={role === "OrganizationOwner" ? "OrganizationOwner" : "Kitchen"}
      />
    </WorkspaceShell>
  )
}

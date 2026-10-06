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
    <OrderKanbanTestHarness
      role={role === "OrganizationOwner" ? "OrganizationOwner" : "Kitchen"}
    />
  )
}

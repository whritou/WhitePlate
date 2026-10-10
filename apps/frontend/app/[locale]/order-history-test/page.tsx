import { WorkspaceShell } from "@/components/organization/workspace-shell"
import { notFound } from "next/navigation"
import { OrderHistoryTable } from "@/components/orders/order-history-table"
import type { OrderHistoryFilters, OrderHistoryPage } from "@/types/orders"

export const dynamic = "force-dynamic"

const tenantId = "33333333-3333-4333-8333-333333333333"

const filters: OrderHistoryFilters = {
  tenantId,
  status: null,
  search: null,
  from: null,
  through: null,
  sort: "createdAt",
  direction: "desc",
  page: 1,
  pageSize: 1,
}

const page: OrderHistoryPage = {
  page: 1,
  pageSize: 1,
  totalCount: 3,
  items: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      customerName: "Ada Lovelace",
      currency: "EUR",
      menuLocale: "en",
      total: 19.25,
      status: "Completed",
      version: 1,
      createdAt: "2026-10-05T10:30:00Z",
      lines: [],
    },
  ],
}

export default async function OrderHistoryTestPage() {
  if (process.env.NODE_ENV !== "development") notFound()

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
      <OrderHistoryTable
        tenantName="Demo restaurant"
        locale="en"
        filters={filters}
        page={page}
      />
    </WorkspaceShell>
  )
}

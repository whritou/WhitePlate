import { expect, it } from "vitest"
import { createQueryClient } from "./query-client"
import { orderQueryKeys } from "./order-query"

it("isolates order pages by account, tenant, locale, status, and cursor", () => {
  const client = createQueryClient()
  const scope = { userId: "alice", tenantId: "bistro", locale: "en" }
  const first = orderQueryKeys.page(scope, null, null)
  client.setQueryData(first, { items: ["private order"], nextCursor: null })

  for (const key of [
    orderQueryKeys.page({ ...scope, userId: "bob" }, null, null),
    orderQueryKeys.page({ ...scope, tenantId: "cafe" }, null, null),
    orderQueryKeys.page({ ...scope, locale: "fr" }, null, null),
    orderQueryKeys.page(scope, "Ready", null),
    orderQueryKeys.page(scope, null, "older"),
  ]) {
    expect(client.getQueryData(key)).toBeUndefined()
  }
  client.clear()
})

it("invalidates every page for only the selected account and tenant", async () => {
  const client = createQueryClient()
  const scope = { userId: "alice", tenantId: "bistro", locale: "en" }
  const current = orderQueryKeys.page(scope, null, null)
  const older = orderQueryKeys.page(
    { ...scope, locale: "fr" },
    "Ready",
    "older"
  )
  const otherTenant = orderQueryKeys.page(
    { ...scope, tenantId: "cafe" },
    null,
    null
  )
  const otherAccount = orderQueryKeys.page(
    { ...scope, userId: "bob" },
    null,
    null
  )
  for (const key of [current, older, otherTenant, otherAccount]) {
    client.setQueryData(key, { items: [], nextCursor: null })
  }

  await client.invalidateQueries({ queryKey: orderQueryKeys.tenant(scope) })

  expect(client.getQueryState(current)?.isInvalidated).toBe(true)
  expect(client.getQueryState(older)?.isInvalidated).toBe(true)
  expect(client.getQueryState(otherTenant)?.isInvalidated).toBe(false)
  expect(client.getQueryState(otherAccount)?.isInvalidated).toBe(false)
  client.clear()
})

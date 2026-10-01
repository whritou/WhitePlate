import { afterEach, expect, it, vi } from "vitest"
import { whitePlateApi } from "@/lib/api"
import { updateOrderStatusAction } from "./order-actions"

vi.mock("@/lib/api", () => ({ whitePlateApi: { patch: vi.fn() } }))

afterEach(() => vi.clearAllMocks())

const input = {
  tenantId: "11111111-1111-4111-8111-111111111111",
  orderId: "22222222-2222-4222-8222-222222222222",
  version: 1,
  status: "Preparing",
}

it.each([
  null,
  {},
  { ...input, tenantId: "not-a-guid" },
  { ...input, orderId: "not-a-guid" },
  { ...input, version: 0 },
  { ...input, version: 1.5 },
  { ...input, status: "Pending" },
  { ...input, status: "Cancelled\r\nAuthorization: attacker" },
])("rejects malformed status input before calling the API: %o", async (value) => {
  await expect(updateOrderStatusAction(value)).resolves.toEqual({
    ok: false,
    error: "invalid",
  })
  expect(whitePlateApi.patch).not.toHaveBeenCalled()
})

it("sends a status update with the version as If-Match", async () => {
  vi.mocked(whitePlateApi.patch).mockResolvedValue({
    ok: true,
    status: 200,
    data: null,
  })

  await expect(updateOrderStatusAction(input)).resolves.toEqual({ ok: true })

  expect(whitePlateApi.patch).toHaveBeenCalledWith(
    `/api/v1/tenants/${input.tenantId}/orders/${input.orderId}/status`,
    { status: "Preparing" },
    { ifMatch: '"1"' }
  )
})

it.each([
  [401, "unauthorized"],
  [403, "forbidden"],
  [409, "conflict"],
  [412, "conflict"],
  [503, "unavailable"],
] as const)("returns a safe message for API status %i", async (status, error) => {
  vi.mocked(whitePlateApi.patch).mockResolvedValue({
    ok: false,
    status,
    error: status === 409 ? "conflict" : "unavailable",
  })

  await expect(updateOrderStatusAction(input)).resolves.toEqual({
    ok: false,
    error,
  })
})

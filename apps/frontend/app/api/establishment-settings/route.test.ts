import { afterEach, expect, it, vi } from "vitest"
import { GET } from "./route"
import { getEstablishmentSettings } from "@/services/establishment-settings"

vi.mock("@/services/establishment-settings", () => ({
  getEstablishmentSettings: vi.fn(),
}))
afterEach(() => vi.resetAllMocks())

const tenantId = "11111111-1111-4111-8111-111111111111"

it.each([
  "",
  "?tenantId=foreign",
  `?tenantId=${tenantId}&tenantId=${tenantId}`,
])("rejects invalid selectors %s before any service call", async (query) => {
  expect(
    (
      await GET(
        new Request(`http://localhost/api/establishment-settings${query}`)
      )
    ).status
  ).toBe(400)
  expect(getEstablishmentSettings).not.toHaveBeenCalled()
})

it.each([401, 404, 503])(
  "returns independent service authorization failures with private no-store headers %i",
  async (status) => {
    vi.mocked(getEstablishmentSettings).mockResolvedValue({
      ok: false,
      status,
      error: "not_found",
    })

    const response = await GET(
      new Request(
        `http://localhost/api/establishment-settings?tenantId=${tenantId}`
      )
    )

    expect(response.status).toBe(status)
    expect(response.headers.get("cache-control")).toBe("private, no-store")
    expect(response.headers.get("vary")).toBe("Cookie")
  }
)

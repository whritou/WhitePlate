import { afterEach, expect, it, vi } from "vitest"
import { saveEstablishmentSettingsAction } from "./establishment-settings"
import { whitePlateApi } from "@/lib/api"

const settings = {
  name: "Bistro",
  phone: null,
  addressLine1: null,
  addressLine2: null,
  postalCode: null,
  city: null,
  region: null,
  countryCode: null,
  latitude: null,
  longitude: null,
  timeZone: "UTC",
  establishmentVersion: 1,
  locales: ["en", "fr"],
  defaultLocale: "en",
  pickupInstructions: { en: "Counter" },
}

vi.mock("server-only", () => ({}))
vi.mock("@/lib/api", () => ({ whitePlateApi: { put: vi.fn() } }))
afterEach(() => vi.resetAllMocks())

const tenantId = "11111111-1111-4111-8111-111111111111"

it("forwards the saved version as If-Match and strips privileged unknown input", async () => {
  vi.mocked(whitePlateApi.put).mockResolvedValue({
    ok: true,
    status: 200,
    data: { ...settings, establishmentVersion: 2 },
  })

  expect(
    await saveEstablishmentSettingsAction({
      ...settings,
      tenantId,
      role: "Owner",
      currency: "USD",
    })
  ).toMatchObject({ ok: true, data: { establishmentVersion: 2 } })
  expect(whitePlateApi.put).toHaveBeenCalledWith(
    `/api/v1/tenants/${tenantId}/establishment-settings`,
    expect.not.objectContaining({ role: "Owner" }),
    { ifMatch: '"1"' }
  )
  expect(vi.mocked(whitePlateApi.put).mock.calls[0][1]).not.toHaveProperty(
    "currency"
  )
})

it.each([
  { tenantId: "../foreign" },
  { establishmentVersion: 0 },
  { name: "" },
  { latitude: 90, longitude: null },
])("rejects malformed action input %o", async (bad) => {
  expect(
    await saveEstablishmentSettingsAction({ ...settings, tenantId, ...bad })
  ).toMatchObject({ ok: false, error: "invalid" })
  expect(whitePlateApi.put).not.toHaveBeenCalled()
})

it.each([401, 404, 412, 503])(
  "keeps safe API failures for status %i",
  async (status) => {
    const failure = {
      ok: false as const,
      status,
      error: "unavailable" as const,
    }

    vi.mocked(whitePlateApi.put).mockResolvedValue(failure)
    expect(
      await saveEstablishmentSettingsAction({ ...settings, tenantId })
    ).toEqual(failure)
  }
)

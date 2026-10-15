import { afterEach, expect, it, vi } from "vitest"
import { GET, PUT } from "./route"
import { getThemeDraft, saveThemeDraft } from "@/services/theme-settings"
import { DEFAULT_THEME } from "@/lib/lovable/storeTheme"
import { themeAppearance } from "@/lib/validation/theme-appearance"

vi.mock("@/services/theme-settings", () => ({
  getThemeDraft: vi.fn(),
  getThemePalette: vi.fn(),
  saveThemeDraft: vi.fn(),
}))
afterEach(() => {
  vi.resetAllMocks()
  vi.unstubAllEnvs()
})

const id = "11111111-1111-4111-8111-111111111111"

it("rejects duplicate tenant selectors and cross-origin saves", async () => {
  expect(
    (
      await GET(
        new Request(
          `http://localhost/api/theme-settings?tenantId=${id}&tenantId=${id}`
        )
      )
    ).status
  ).toBe(400)
  expect(
    (
      await PUT(
        new Request(`http://localhost/api/theme-settings?tenantId=${id}`, {
          method: "PUT",
          headers: { origin: "https://foreign.test" },
          body: "{}",
        })
      )
    ).status
  ).toBe(403)
  expect(saveThemeDraft).not.toHaveBeenCalled()
})

it("preserves safe failures and private caching", async () => {
  vi.mocked(getThemeDraft).mockResolvedValue({
    ok: false,
    status: 404,
    error: "not_found",
  })

  const response = await GET(
    new Request(`http://localhost/api/theme-settings?tenantId=${id}`)
  )

  expect(response.status).toBe(404)
  expect(response.headers.get("cache-control")).toBe("private, no-store")
  expect(response.headers.get("vary")).toBe("Cookie")
})

it("forwards only validated settings and the version, preserving conflicts", async () => {
  vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000")
  vi.mocked(saveThemeDraft).mockResolvedValue({
    ok: false,
    status: 412,
    error: "conflict",
  })

  const request = (body: unknown) =>
    new Request(`http://localhost:3000/api/theme-settings?tenantId=${id}`, {
      method: "PUT",
      headers: { origin: "http://localhost:3000" },
      body: JSON.stringify(body),
    })

  expect(
    (
      await PUT(
        request({
          theme: { ...themeAppearance(DEFAULT_THEME), logo: "unsafe" },
          version: 1,
        })
      )
    ).status
  ).toBe(400)
  expect(
    (await PUT(request({ theme: themeAppearance(DEFAULT_THEME), version: 1 })))
      .status
  ).toBe(412)
  expect(saveThemeDraft).toHaveBeenCalledTimes(1)
})

it("bounds chunked bodies even without a content length", async () => {
  vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000")
  expect(
    (
      await PUT(
        new Request(`http://localhost:3000/api/theme-settings?tenantId=${id}`, {
          method: "PUT",
          headers: { origin: "http://localhost:3000" },
          body: " ".repeat(8193),
        })
      )
    ).status
  ).toBe(400)
  expect(saveThemeDraft).not.toHaveBeenCalled()
})

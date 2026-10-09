import { afterEach, expect, it, vi } from "vitest"
import { GET, POST, PUT } from "./route"
import {
  getProductPhotos,
  uploadProductPhoto,
  saveProductPhotos,
} from "@/services/product-photos"

vi.mock("@/services/product-photos", () => ({
  getProductPhotos: vi.fn(),
  readProductPhoto: vi.fn(),
  uploadProductPhoto: vi.fn(),
  saveProductPhotos: vi.fn(),
}))
afterEach(() => {
  vi.resetAllMocks()
  vi.unstubAllEnvs()
})

const target =
  "http://localhost:3000/api/product-photos?tenantId=11111111-1111-4111-8111-111111111111&productId=22222222-2222-4222-8222-222222222222"

it.each([POST, PUT])(
  "rejects foreign origins before any protected request",
  async (handler) => {
    expect(
      (
        await handler(
          new Request(target, {
            method: "POST",
            headers: { origin: "https://foreign.test" },
          })
        )
      ).status
    ).toBe(403)
    expect(getProductPhotos).not.toHaveBeenCalled()
    expect(saveProductPhotos).not.toHaveBeenCalled()
  }
)

it("denies uploads before consuming file bytes when membership has been revoked", async () => {
  vi.mocked(getProductPhotos).mockResolvedValue({
    ok: false,
    status: 404,
    error: "not_found",
  })

  const result = await POST(
    new Request(target, {
      method: "POST",
      headers: { origin: "http://localhost:3000" },
      body: new Uint8Array([1]),
    })
  )

  expect(result.status).toBe(404)
  expect(uploadProductPhoto).not.toHaveBeenCalled()
})

it("rejects duplicate selectors and exposes no shared cache", async () => {
  expect(
    (
      await GET(
        new Request(target + "&productId=22222222-2222-4222-8222-222222222222")
      )
    ).status
  ).toBe(400)
  vi.mocked(getProductPhotos).mockResolvedValue({
    ok: true,
    status: 200,
    data: { storageAvailable: true, assets: [] },
  })

  const result = await GET(new Request(target))

  expect(result.headers.get("cache-control")).toBe("private, no-store")
  expect(result.headers.get("vary")).toBe("Cookie")
})

import { afterEach, expect, it, vi } from "vitest"
import { GET, POST, PUT, DELETE } from "./route"
import {
  getBrandAssets,
  readBrandAsset,
  uploadBrandAsset,
  changeBrandAsset,
} from "@/services/brand-assets"

vi.mock("@/services/brand-assets", () => ({
  getBrandAssets: vi.fn(),
  readBrandAsset: vi.fn(),
  uploadBrandAsset: vi.fn(),
  changeBrandAsset: vi.fn(),
}))

afterEach(() => {
  vi.resetAllMocks()
  vi.unstubAllEnvs()
})

const tenantId = "11111111-1111-4111-8111-111111111111"
const assetId = "22222222-2222-4222-8222-222222222222"
const target = `http://localhost:3000/api/brand-assets?tenantId=${tenantId}&slot=logo`

it.each([POST, PUT, DELETE])(
  "rejects cross-origin mutations before contacting storage",
  async (handler) => {
    const response = await handler(
      new Request(target, {
        method: "POST",
        headers: { Origin: "https://foreign.example" },
      })
    )

    expect(response.status).toBe(403)
    expect(getBrandAssets).not.toHaveBeenCalled()
    expect(changeBrandAsset).not.toHaveBeenCalled()
  }
)

it("denies upload before reading bytes when persisted API membership denies it", async () => {
  vi.mocked(getBrandAssets).mockResolvedValue({
    ok: false,
    error: "not_found",
    status: 404,
  })

  const response = await POST(
    new Request(target, {
      method: "POST",
      headers: { Origin: "http://localhost:3000" },
      body: new Uint8Array([1]),
    })
  )

  expect(response.status).toBe(404)
  expect(uploadBrandAsset).not.toHaveBeenCalled()
})

it("forwards original bounded bytes and returns a private normalized draft", async () => {
  vi.mocked(getBrandAssets).mockResolvedValue({
    ok: true,
    status: 200,
    data: { storageAvailable: true, assets: [] },
  })

  const asset = {
    id: assetId,
    slot: "logo" as const,
    contentType: "image/png" as const,
    width: 512,
    height: 512,
    bytes: 12,
  }

  vi.mocked(uploadBrandAsset).mockResolvedValue({
    ok: true,
    status: 201,
    data: asset,
  })

  const response = await POST(
    new Request(target, {
      method: "POST",
      headers: { Origin: "http://localhost:3000" },
      body: new Uint8Array([1, 2, 3]),
    })
  )

  expect(response.status).toBe(201)
  expect(await response.json()).toEqual(asset)
  expect(response.headers.get("cache-control")).toBe("private, no-store")
  expect(
    new Uint8Array(
      await vi.mocked(uploadBrandAsset).mock.calls[0][3].arrayBuffer()
    )
  ).toEqual(new Uint8Array([1, 2, 3]))
})

it("rejects duplicate selectors, oversized bodies and missing preconditions", async () => {
  expect(
    (await GET(new Request(`${target}&tenantId=${tenantId}`))).status
  ).toBe(400)
  vi.mocked(getBrandAssets).mockResolvedValue({
    ok: true,
    status: 200,
    data: { storageAvailable: true, assets: [] },
  })
  expect(
    (
      await POST(
        new Request(target, {
          method: "POST",
          headers: { Origin: "http://localhost:3000" },
          body: new Uint8Array(2 * 1024 * 1024 + 1),
        })
      )
    ).status
  ).toBe(413)
  expect(uploadBrandAsset).not.toHaveBeenCalled()
  expect(
    (
      await PUT(
        new Request(target, {
          method: "PUT",
          headers: { Origin: "http://localhost:3000" },
          body: JSON.stringify({ assetId }),
        })
      )
    ).status
  ).toBe(400)
  expect(changeBrandAsset).not.toHaveBeenCalled()
})

it("delivers authenticated image bytes without a shared cache", async () => {
  vi.mocked(readBrandAsset).mockResolvedValue({
    ok: true,
    status: 200,
    data: new Blob([new Uint8Array([1, 2])], { type: "image/png" }),
  })

  const response = await GET(new Request(`${target}&assetId=${assetId}`))

  expect(response.headers.get("content-type")).toBe("image/png")
  expect(response.headers.get("vary")).toBe("Cookie")
  expect(response.headers.get("x-content-type-options")).toBe("nosniff")
  expect(response.headers.get("cache-control")).toBe("private, no-store")
})

import { describe, expect, it } from "vitest"
import {
  parseProductPhotos,
  photoUrl,
  validatePhotoFile,
} from "./product-photos"

const tenant = "11111111-1111-4111-8111-111111111111"
const product = "22222222-2222-4222-8222-222222222222"
const photo = {
  id: "33333333-3333-4333-8333-333333333333",
  width: 640,
  height: 480,
  bytes: 4000,
}

describe("product gallery boundary", () => {
  it("rejects duplicate, oversized and invalid gallery metadata", () => {
    expect(
      parseProductPhotos({ storageAvailable: true, assets: [photo, photo] })
    ).toBeNull()
    expect(
      parseProductPhotos({
        storageAvailable: true,
        assets: [{ ...photo, width: 5000 }],
      })
    ).toBeNull()
    expect(
      parseProductPhotos({
        storageAvailable: true,
        assets: Array(9).fill(photo),
      })
    ).toBeNull()
    expect(
      parseProductPhotos({ storageAvailable: true, assets: [photo] })?.assets
    ).toEqual([photo])
  })

  it("constructs delivery paths without accepting arbitrary URLs", () => {
    expect(photoUrl(product, photo.id, 320)).toBe(
      `/api/public/product-photos/${product}/${photo.id}/320`
    )
    expect(photoUrl(product, photo.id, 640, tenant)).toBe(
      `/api/product-photos?tenantId=${tenant}&productId=${product}&assetId=${photo.id}&size=640`
    )
    expect(photoUrl("https://foreign.test", photo.id, 320)).toBeUndefined()
  })

  it("rejects empty and over-limit browser files before upload", () => {
    expect(validatePhotoFile(new File([], "empty.png"))).toBe(false)
    expect(
      validatePhotoFile(
        new File([new Uint8Array(4 * 1024 * 1024 + 1)], "large.png")
      )
    ).toBe(false)
    expect(validatePhotoFile(new File(["bytes"], "image.jpg"))).toBe(true)
  })
})

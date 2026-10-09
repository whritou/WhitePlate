import { expect, it } from "vitest"
import {
  parseBrandAsset,
  parseBrandAssets,
  validateBrandFile,
} from "./brand-assets"

const asset = {
  id: "11111111-1111-4111-8111-111111111111",
  slot: "logo",
  contentType: "image/png",
  width: 512,
  height: 512,
  bytes: 100,
}

it("rejects foreign shapes, unsafe types and duplicate brand slots", () => {
  expect(
    parseBrandAssets({ storageAvailable: true, assets: [asset] })?.assets
  ).toEqual([asset])
  expect(
    parseBrandAssets({ storageAvailable: true, assets: [asset, asset] })
  ).toBeNull()
  expect(parseBrandAsset({ ...asset, contentType: "image/svg+xml" })).toBeNull()
  expect(parseBrandAsset({ ...asset, slot: "../logo" })).toBeNull()
  expect(parseBrandAsset({ ...asset, width: 5000 })).toBeNull()
})

it("checks the transport limit without trusting filenames as actual content validation", () => {
  expect(
    validateBrandFile(
      "logo",
      new File([new Uint8Array(2 * 1024 * 1024)], "logo.png")
    )
  ).toBe(true)
  expect(
    validateBrandFile(
      "logo",
      new File([new Uint8Array(2 * 1024 * 1024 + 1)], "logo.png")
    )
  ).toBe(false)
  expect(validateBrandFile("favicon", new File([], "icon.ico"))).toBe(false)
})

import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it, vi } from "vitest"
import type { ProductPhoto } from "@/types/product-photos"
import { ProductPhotoGallery } from "./photo-gallery"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}))

it("keeps the restaurant selector on every live gallery image", () => {
  const photos = [
    {
      id: "124e4567-e89b-42d3-a456-426614174001",
      width: 800,
      height: 600,
      bytes: 1200,
    },
    {
      id: "124e4567-e89b-42d3-a456-426614174002",
      width: 800,
      height: 600,
      bytes: 1200,
    },
  ] as ProductPhoto[]

  const html = renderToStaticMarkup(
    createElement(ProductPhotoGallery, {
      productId: "123e4567-e89b-42d3-a456-426614174000",
      restaurantSlug: "bistro",
      photos,
    })
  )

  expect(html.match(/restaurantSlug=bistro/g) ?? []).toHaveLength(3)
})

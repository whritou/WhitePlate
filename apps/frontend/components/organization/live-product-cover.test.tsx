import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, expect, it, vi } from "vitest"
import { LiveProductCover } from "./live-product-cover"

const { useQuery } = vi.hoisted(() => ({ useQuery: vi.fn() }))

vi.mock("@tanstack/react-query", () => ({ useQuery }))
vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}))
vi.mock("@/components/product/photo-image", () => ({
  ProductPhotoImage: ({ photo }: { photo?: unknown }) =>
    createElement("span", { "data-photo-loaded": Boolean(photo) }),
}))

beforeEach(() => {
  useQuery.mockReturnValue({ data: undefined })
})

it("does not query private product photos when a Kitchen user has no photo access", () => {
  renderToStaticMarkup(
    createElement(LiveProductCover, {
      tenantId: "tenant-1",
      productId: "product-1",
    })
  )

  expect(useQuery).toHaveBeenCalledWith(
    expect.objectContaining({ enabled: false })
  )
})

it("loads a real cover for a photo-authorized user", () => {
  renderToStaticMarkup(
    createElement(LiveProductCover, {
      userId: "manager-1",
      tenantId: "tenant-1",
      productId: "product-1",
    })
  )

  expect(useQuery).toHaveBeenCalledWith(
    expect.objectContaining({ enabled: true })
  )
})

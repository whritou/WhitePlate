import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it, vi } from "vitest"
import { ProductAvailabilityControls } from "./product-availability-controls"

vi.mock("@/actions/catalog", () => ({
  setProductAvailabilityAction: vi.fn(),
}))

vi.mock("./live-product-cover", () => ({
  LiveProductCover: ({
    productId,
    userId,
  }: {
    productId: string
    userId?: string
  }) =>
    createElement("span", {
      "data-product-cover": productId,
      "data-photo-user": userId,
    }),
}))

const labels = {
  available: "Available",
  unavailable: "Unavailable",
  markAvailable: "Make available",
  markUnavailable: "Mark unavailable",
  availabilityFor: "Availability",
  updating: "Updating…",
  updated: "Availability updated.",
  updateFailed: "Could not update availability.",
}

it("renders product covers in availability cards for photo-authorized users", () => {
  const html = renderToStaticMarkup(
    createElement(ProductAvailabilityControls, {
      tenantId: "tenant-1",
      userId: "manager-1",
      canManageAvailability: true,
      products: [{ id: "product-1", name: "Soup", isAvailable: true }],
      labels,
    })
  )

  expect(html).toContain('data-product-cover="product-1"')
  expect(html).toContain('data-photo-user="manager-1"')
  expect(html).toContain("Soup")
})

it("keeps photo access disabled when Kitchen controls availability", () => {
  const html = renderToStaticMarkup(
    createElement(ProductAvailabilityControls, {
      tenantId: "tenant-1",
      userId: undefined,
      canManageAvailability: false,
      products: [{ id: "product-1", name: "Soup", isAvailable: true }],
      labels,
    })
  )

  expect(html).toContain('data-product-cover="product-1"')
  expect(html).not.toContain("data-photo-user=")
  expect(html).not.toContain("<button")
})

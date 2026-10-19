import type { Page } from "@playwright/test"
import sharp from "sharp"

const photo = sharp(
  Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="#d5b788"/><circle cx="320" cy="240" r="150" fill="#fbf4df"/><path d="M200 260L320 100L440 260Z" fill="#52814e"/></svg>'
  )
)
  .png()
  .toBuffer()

export async function installParityFixtures(page: Page) {
  await page.route("**/api/public/product-photos/**", async (route) =>
    route.fulfill({
      contentType: "image/png",
      body: await photo,
    })
  )
  await page.route("**/api/public/order-quote**", (route) =>
    route.fulfill({
      json: {
        currency: "EUR",
        subtotal: 19,
        discountAmount: 0,
        taxAmount: 0,
        total: 19,
        lines: [
          {
            productId: "33333333-3333-4333-8333-333333333333",
            productName: "Burrata",
            quantity: 1,
            subtotal: 19,
            total: 19,
            options: [],
          },
        ],
      },
    })
  )
}

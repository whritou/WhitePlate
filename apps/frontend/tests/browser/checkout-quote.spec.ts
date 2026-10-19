import { expect, test } from "@playwright/test"
import { captureParityRegion, expectSamePixels } from "./helpers/pixel-parity"

test("checkout displays authoritative quote totals and blocks an unavailable quote", async ({
  page,
}) => {
  let unavailable = false

  await page.route("**/api/public/pickup-slots**", (route) =>
    route.fulfill({
      json: {
        state: "available",
        timeZone: "Europe/Paris",
        slots: [
          {
            startsAt: "2026-10-19T18:00:00Z",
            endsAt: "2026-10-19T18:15:00Z",
            timeZone: "Europe/Paris",
            remainingCapacity: 5,
          },
        ],
      },
    })
  )

  await page.route("**/api/public/order-quote**", async (route) => {
    const body = route.request().postDataJSON()

    expect(body).not.toHaveProperty("customerName")
    expect(body).not.toHaveProperty("customerEmail")
    await route.fulfill(
      unavailable
        ? { status: 503, json: { error: "unavailable" } }
        : {
            json: {
              currency: "EUR",
              subtotal: 19,
              discountAmount: body.discountCode ? 2 : 0,
              taxAmount: body.discountCode ? 1.7 : 1.9,
              total: body.discountCode ? 18.7 : 20.9,
              lines: [
                {
                  productId: "33333333-3333-4333-8333-333333333333",
                  productName: "Burrata",
                  quantity: 1,
                  subtotal: 19,
                  total: 20.9,
                  options: [],
                },
              ],
            },
          }
    )
  })
  await page.goto("/fr/studio-parity-test?screen=checkout&mode=actual")
  await expect(page.locator(".customer-summary dl")).toContainText("€20.90")
  await expect(
    page.getByRole("button", { name: "Passer la commande", exact: true })
  ).toBeEnabled()
  await page.getByRole("textbox", { name: "Code promo" }).fill("SAVE")
  await page.getByRole("button", { name: "Appliquer", exact: true }).click()
  await expect(page.locator(".customer-summary dl")).toContainText("€18.70")
  unavailable = true
  await page.getByRole("textbox", { name: "Code promo" }).fill("OTHER")
  await page.getByRole("button", { name: "Appliquer", exact: true }).click()
  await expect(page.locator(".customer-summary [role=alert]")).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Passer la commande", exact: true })
  ).toBeDisabled()
})

for (const width of [390, 1024]) {
  test(`quoted totals match Studio before and after a discount at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await page.route("**/api/public/order-quote**", (route) => {
      const discounted = !!route.request().postDataJSON().discountCode

      return route.fulfill({
        json: {
          currency: "EUR",
          subtotal: 19,
          discountAmount: discounted ? 2 : 0,
          taxAmount: discounted ? 1.7 : 1.9,
          total: discounted ? 18.7 : 20.9,
          lines: [
            {
              productId: "33333333-3333-4333-8333-333333333333",
              productName: "Burrata",
              quantity: 1,
              subtotal: 19,
              total: 20.9,
              options: [],
            },
          ],
        },
      })
    })

    const captures: Buffer[][] = []

    for (const reference of [true, false]) {
      await page.goto(
        `/fr/studio-parity-test?screen=checkout&pricing=1&reference=${reference ? 1 : 0}`
      )
      await expect(page.locator(".customer-summary dl")).toContainText("€20.90")

      const initial = await captureParityRegion(
        page,
        ".customer-summary dl",
        testInfo.outputPath(`quote-${width}-${reference}-initial.png`)
      )

      await page.getByRole("textbox", { name: "Code promo" }).fill("SAVE")
      await page.getByRole("button", { name: "Appliquer", exact: true }).click()
      await expect(page.locator(".customer-summary dl")).toContainText("€18.70")

      const discounted = await captureParityRegion(
        page,
        ".customer-summary dl",
        testInfo.outputPath(`quote-${width}-${reference}-discount.png`)
      )

      captures.push([initial.bytes, discounted.bytes])
    }

    for (let state = 0; state < 2; state++)
      await expectSamePixels(
        captures[0][state],
        captures[1][state],
        testInfo.outputPath(`quote-${width}-${state}-difference.json`),
        "quoted prices"
      )
  })
}

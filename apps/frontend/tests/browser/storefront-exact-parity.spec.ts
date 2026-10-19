import { installParityFixtures } from "./helpers/parity-fixtures"
import { exerciseUncertainCheckout } from "./helpers/checkout-states"
import { expect, test } from "@playwright/test"
import { writeFile } from "node:fs/promises"
import {
  captureParityRegion,
  expectSamePixels,
  parityCaptureOptions,
} from "./helpers/pixel-parity"

test.use({ locale: "fr-FR", timezoneId: "Europe/Paris" })

test.beforeEach(async ({ page }) => installParityFixtures(page))

for (const width of [390, 1024]) {
  for (const screen of ["checkout", "tracking", "confirmation"]) {
    test(`${screen}: compare shared regions and exercise real states at ${width}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 })
      await page.route("**/api/public/pickup-slots**", (route) =>
        route.fulfill({
          json: {
            state: "available",
            timeZone: "Europe/Paris",
            slots: [
              {
                startsAt: "2026-10-18T10:30:00Z",
                endsAt: "2026-10-18T10:45:00Z",
                timeZone: "Europe/Paris",
                remainingCapacity: 5,
              },
            ],
          },
        })
      )

      let status = "Preparing"

      await page.route("**/api/public/establishment**", (route) =>
        route.fulfill({
          json: {
            name: "Maison Verte",
            phone: "+33123456789",
            addressLine1: "12 rue de la Roquette",
            addressLine2: null,
            postalCode: "75011",
            city: "Paris",
            region: null,
            countryCode: "FR",
            latitude: null,
            longitude: null,
            timeZone: "Europe/Paris",
            pickupInstruction: null,
            pickupLocale: "fr",
            openingHours: null,
          },
        })
      )
      await page.route("**/api/public/orders/*/tracking**", (route) =>
        route.fulfill({
          json: {
            id: "55555555-5555-4555-8555-555555555555",
            status,
            version: 2,
            createdAt: "2026-10-18T10:00:00Z",
            pickupAt: "2026-10-18T10:30:00Z",
            pickupTimeZone: "Europe/Paris",
            menuLocale: "fr",
            summary: {
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
                  subtotal: 12,
                  total: 12,
                  options: [
                    {
                      optionId: "66666666-6666-4666-8666-666666666666",
                      name: "Salade",
                      priceAdjustment: 1,
                    },
                  ],
                },
                {
                  productId: "44444444-4444-4444-8444-444444444444",
                  productName: "Tiramisu",
                  quantity: 1,
                  subtotal: 7,
                  total: 7,
                  options: [],
                },
              ],
            },
          },
        })
      )

      const regions =
        screen === "checkout"
          ? [
              ".customer-page > header",
              ".customer-summary ul",
              ".customer-two-column > div > section:first-child",
              ".customer-two-column > div > section:nth-child(3)",
            ]
          : screen === "confirmation"
            ? [".customer-page > header", ".customer-summary ul"]
            : [
                ".customer-page > header",
                ".customer-two-column > div > ol",
                ".customer-summary ul",
              ]
      const captures: Buffer[][] = []

      for (const reference of [true, false]) {
        await page.goto(
          `/fr/studio-parity-test?screen=${screen}&reference=${reference ? 1 : 0}#${"a".repeat(43)}`
        )
        await expect(page.locator(".customer-summary ul li")).toHaveCount(2)
        if (screen === "checkout") {
          await expect(
            page.locator("form.customer-two-column")
          ).toHaveAttribute("aria-busy", "false")
          await page.locator("#customer-name").fill("Alex Martin")
          await page.locator("#customer-phone").fill("+33123456789")
          await page.locator("#order-notes").fill("Sans couverts, merci.")
          await page
            .getByRole("checkbox", {
              name: "Recevoir les nouvelles de cette commande par e-mail",
              exact: true,
            })
            .check()
          await page
            .getByRole("checkbox", {
              name: "Autoriser les statistiques facultatives sur la source et les commandes récurrentes",
              exact: true,
            })
            .check()
          await page.locator("#customer-email").fill("alex@example.test")
          await expect(page.locator("#customer-phone")).toHaveValue(
            "+33123456789"
          )
          await expect(page.locator("#order-notes")).toHaveValue(
            "Sans couverts, merci."
          )
        }

        await expect(
          page.locator(".customer-summary ul img").first()
        ).toHaveJSProperty("naturalWidth", 640)
        if (screen === "confirmation" || (screen === "tracking" && !reference))
          await expect(
            page
              .locator(".customer-two-column")
              .getByText("12 rue de la Roquette, 75011 Paris, France", {
                exact: true,
              })
              .first()
          ).toBeVisible()
        await page.evaluate(() => document.fonts.ready)
        await page.screenshot({
          path: testInfo.outputPath(
            `${screen}-${width}-${reference ? "studio" : "live"}.png`
          ),
          fullPage: true,
          ...parityCaptureOptions,
        })

        const parts: Buffer[] = []

        for (const [index, selector] of regions.entries()) {
          const { bytes } = await captureParityRegion(
            page,
            selector,
            testInfo.outputPath(
              `${screen}-${width}-${reference ? "studio" : "live"}-region-${index}.png`
            )
          )

          parts.push(bytes)
          await writeFile(
            testInfo.outputPath(
              `${screen}-${width}-${reference ? "studio" : "live"}-region-${index}.png`
            ),
            bytes
          )
        }

        captures.push(parts)
      }

      for (const [index, selector] of regions.entries())
        await expectSamePixels(
          captures[0][index],
          captures[1][index],
          testInfo.outputPath(
            `${screen}-${width}-region-${index}-difference.json`
          ),
          `${screen} ${selector}`
        )
      if (screen === "checkout") {
        await page.getByLabel("Choisir un horaire").check()
        await expect(page.locator("#scheduled-pickup-time")).toBeVisible()
        await page
          .getByRole("checkbox", {
            name: "Recevoir les nouvelles de cette commande par e-mail",
            exact: true,
          })
          .check()
        await expect(page.locator("#customer-email")).toBeVisible()

        await exerciseUncertainCheckout(page, testInfo, width)
      } else if (screen === "tracking") {
        for (const next of ["Pending", "Ready", "Completed", "Cancelled"]) {
          status = next
          await page
            .getByRole("button", { name: "Actualiser l’état", exact: true })
            .click()
          await expect(
            page.locator(".customer-shell-content [role=status]").first()
          ).toHaveText(
            {
              Pending: "Reçue par le restaurant",
              Ready: "Prête",
              Completed: "Terminée",
              Cancelled: "Annulée",
            }[next]!
          )
          await expect(
            page.locator(".customer-two-column ol [aria-current=step]")
          ).toHaveCount(next === "Cancelled" ? 0 : 1)
          await page.screenshot({
            path: testInfo.outputPath(`tracking-${width}-${next}.png`),
            fullPage: true,
            ...parityCaptureOptions,
          })
        }
      }
    })
  }
}

for (const width of [390, 1024]) {
  test(`pixel comparison with identical Studio data at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })

    const captures: Record<string, Buffer[]> = {}
    const geometry: Record<
      string,
      Awaited<ReturnType<typeof captureParityRegion>>["bounds"][]
    > = {}

    for (const reference of [true, false]) {
      await page.goto(`/fr/studio-parity-test?reference=${reference ? 1 : 0}`)
      await expect(page.locator(".storefront-page")).toHaveAttribute(
        "aria-busy",
        "false"
      )
      expect(
        (await page.locator(".storefront-page").boundingBox())!.height
      ).toBeGreaterThanOrEqual(900)
      await page.evaluate(() => document.fonts.ready)
      await expect(page.locator("article img").first()).toHaveJSProperty(
        "naturalWidth",
        640
      )

      const capture = async (state: string, selector: string) => {
        const result = await captureParityRegion(
          page,
          selector,
          testInfo.outputPath(
            "captures",
            `${width}-${reference ? "studio" : "live"}-${state}.png`
          )
        )

        captures[state] ??= []
        captures[state].push(result.bytes)
        captures[`${state}-viewport`] ??= []
        captures[`${state}-viewport`].push(result.viewport)
        geometry[state] ??= []
        geometry[state].push(result.bounds)
      }

      await capture("card", "article:first-child")
      await page
        .getByRole("button", { name: "Add Burrata", exact: true })
        .click()
      await page
        .getByRole("button", { name: "Salade +€1.00", exact: true })
        .click()
      await expect(
        page.getByRole("button", { name: /Salade \+€1\.00/ })
      ).toHaveAttribute("aria-pressed", "true")
      await capture("modal", "[role=dialog]")
      await page
        .getByRole("button", { name: "Ajouter 1 · €12.00", exact: true })
        .click()
      await page
        .getByRole("button", { name: "Add Tiramisu", exact: true })
        .click()

      const floating = page.locator(".storefront-page > button")

      await expect(floating).toBeVisible()
      await expect(floating).toContainText("€19.00")
      await capture("floating", ".storefront-page > button")
      await floating.click()
      await expect(
        page.getByRole("dialog").getByText("Burrata", { exact: true })
      ).toBeVisible()
      await expect(
        page.getByRole("dialog").getByText("Tiramisu", { exact: true })
      ).toBeVisible()
      await capture("basket", "[role=dialog]")
      await page.getByRole("button", { name: "Fermer", exact: true }).click()
      await page.getByRole("button", { name: "Burrata", exact: true }).click()
      await page
        .getByRole("button", { name: "Ajouter 1 · €11.50", exact: true })
        .click()
      await floating.click()
      await expect(page.getByRole("dialog").locator("li")).toHaveCount(3)

      const potatoLine = page
        .getByRole("dialog")
        .locator("li")
        .filter({ hasText: "Pommes de terre" })

      await potatoLine.getByRole("button", { name: "+", exact: true }).click()
      await expect(potatoLine).toContainText("€23.00")
      await capture("basket-variants", "[role=dialog]")
    }

    for (const [state, [studio, live]] of Object.entries(captures)) {
      await expectSamePixels(
        studio,
        live,
        testInfo.outputPath(`${width}-${state}-difference.json`),
        state
      )
    }

    for (const [state, [studio, live]] of Object.entries(geometry))
      expect(live, `${state} geometry`).toEqual(studio)
  })
}

// Regression: the real store used a narrow card grid and a separate dialog recipe.
for (const width of [390, 1024]) {
  test(`Studio product geometry and filled floating basket at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto("/fr/live-workspace-test?view=store&theme=parity")

    const card = page.locator("main article").first()
    const bounds = await card.boundingBox()

    expect(bounds!.width).toBeCloseTo(width - 48, 0)
    await card.getByRole("button").last().click()

    const dialog = page.getByRole("dialog").last()
    const dialogBounds = await dialog.boundingBox()

    expect(dialogBounds!.width).toBeCloseTo(Math.min(width - 32, 448), 0)

    // Studio places the photo first, before product information and options.
    const heading = await dialog.getByRole("heading").first().boundingBox()

    expect(heading!.y - dialogBounds!.y).toBeGreaterThan(200)
  })
}

import { expect, test } from "@playwright/test"

const asset = {
  id: "33333333-3333-4333-8333-333333333333",
  width: 640,
  height: 480,
  bytes: 4000,
}

test("failed uploads keep the saved cover and can be retried; invalid files do not upload", async ({
  page,
}) => {
  let failUpload = true
  let uploads = 0

  await page.route("**/api/product-photos?**", async (route) => {
    const request = route.request()

    if (new URL(request.url()).searchParams.has("assetId"))
      return route.fulfill({
        path: "public/design/photo-15.webp",
        contentType: "image/webp",
      })
    if (request.method() === "POST") {
      uploads++

      return failUpload
        ? route.fulfill({ status: 503, json: { error: "unavailable" } })
        : route.fulfill({
            status: 201,
            json: { ...asset, id: "44444444-4444-4444-8444-444444444444" },
          })
    }

    return route.fulfill({ json: { storageAvailable: true, assets: [asset] } })
  })
  await page.goto("/en/photo-design-test")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )
  await page.getByLabel("Choose product photos").setInputFiles({
    name: "empty.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(0),
  })
  await expect(
    page.getByRole("region", { name: "Product photography" }).getByRole("alert")
  ).toContainText("valid photo")
  expect(uploads).toBe(0)
  await page.getByRole("button", { name: "Replace photo", exact: true }).click()
  await page.getByLabel("Choose product photos").setInputFiles({
    name: "burger.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from([255, 216, 255]),
  })
  await expect(
    page.getByRole("region", { name: "Product photography" }).getByRole("alert")
  ).toContainText("kept")
  await expect(page.getByText("Cover photo", { exact: true })).toBeVisible()
  failUpload = false
  await page.getByRole("button", { name: "Retry upload", exact: true }).click()
  await expect(page.getByText("Unsaved photo changes")).toBeVisible()
  expect(uploads).toBe(2)
  await page
    .getByRole("button", { name: "Discard photo changes", exact: true })
    .click()
  await expect(page.getByText("Unsaved photo changes")).not.toBeVisible()
})

test("gallery replacement/save failures keep drafts and removal returns keyboard focus", async ({
  page,
  context,
}) => {
  let saved = [asset]
  let fail = true

  await page.route("**/api/product-photos?**", async (route) => {
    const request = route.request()

    if (new URL(request.url()).searchParams.has("assetId"))
      return route.fulfill({
        path: "public/design/photo-15.webp",
        contentType: "image/webp",
      })
    if (request.method() === "POST")
      return route.fulfill({
        status: 201,
        json: { ...asset, id: "44444444-4444-4444-8444-444444444444" },
      })
    if (request.method() === "PUT") {
      if (fail)
        return route.fulfill({ status: 503, json: { error: "unavailable" } })
      saved = request
        .postDataJSON()
        .assetIds.map((id: string) => ({ ...asset, id }))
    }

    return route.fulfill({ json: { storageAvailable: true, assets: saved } })
  })
  await page.goto("/en/photo-design-test")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )
  await page.getByLabel("Choose product photos").setInputFiles({
    name: "burger.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from([255, 216, 255]),
  })
  await expect(page.getByText("Unsaved photo changes")).toBeVisible()
  await page.getByRole("button", { name: "Save photos", exact: true }).click()
  await expect(
    page.getByRole("region", { name: "Product photography" }).getByRole("alert")
  ).toContainText("kept")
  await expect(
    page.getByRole("button", { name: "Save photos", exact: true })
  ).toBeEnabled()
  await context.setOffline(true)
  await page.getByRole("button", { name: "Save photos", exact: true }).click()
  await expect(
    page.getByRole("region", { name: "Product photography" }).getByRole("alert")
  ).toContainText("offline")
  await context.setOffline(false)
  fail = false
  await page.getByRole("button", { name: "Save photos", exact: true }).click()
  await expect(
    page.getByText("Photos saved. Guest menu updated.")
  ).toBeVisible()
  await page.getByRole("button", { name: "Show photo 2", exact: true }).click()
  await page
    .getByRole("button", { name: "Remove photo 2", exact: true })
    .click()
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Remove", exact: true })
    .click()
  await expect(
    page.getByRole("button", { name: "Add photos", exact: true })
  ).toBeFocused()
  await page.getByRole("button", { name: "Save photos", exact: true }).click()
  expect(saved).toHaveLength(1)
})

for (const locale of ["en", "fr"])
  for (const mode of ["light", "dark"])
    for (const width of [320, 375, 390, 768, 1024, 1440, 1920]) {
      test(`photo editor ${locale} ${mode} ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1100 })
        await page.emulateMedia({
          colorScheme: mode as "light" | "dark",
          reducedMotion: "reduce",
        })
        await page.addInitScript(
          (theme) => localStorage.setItem("theme", theme),
          mode
        )
        await page.route("**/api/product-photos?**", (route) =>
          new URL(route.request().url()).searchParams.has("assetId")
            ? route.fulfill({
                path: "public/design/photo-15.webp",
                contentType: "image/webp",
              })
            : route.fulfill({
                json: { storageAvailable: true, assets: [asset] },
              })
        )
        await page.goto(`/${locale}/photo-design-test`)
        await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
          "data-ready",
          "true"
        )
        await expect(
          page.getByRole("region", {
            name:
              locale === "en"
                ? "Product photography"
                : "Photographies du produit",
          })
        ).toBeVisible()

        const photoPanel = page.getByRole("region", {
          name:
            locale === "en"
              ? "Product photography"
              : "Photographies du produit",
        })

        expect((await photoPanel.boundingBox())!.width).toBeGreaterThanOrEqual(
          200
        )

        await page.addStyleTag({
          content: "html { font-size: 200% } nextjs-portal { display: none }",
        })
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1
          )
        ).toBe(true)

        const add = page.getByRole("button", {
          name: locale === "en" ? "Add photos" : "Ajouter des photos",
          exact: true,
        })

        expect((await add.boundingBox())!.height).toBeGreaterThanOrEqual(
          width >= 768 ? 48 : 44
        )
        if (
          (locale === "fr" && mode === "light" && width === 1440) ||
          (locale === "en" && mode === "dark" && width === 390)
        ) {
          await page.addStyleTag({ content: "html { font-size: 100% }" })
          await page.screenshot({
            path: `../../docs/audits/assets/product-photos/${locale}-${mode}-${width}.png`,
            fullPage: true,
          })
        }
      })
    }

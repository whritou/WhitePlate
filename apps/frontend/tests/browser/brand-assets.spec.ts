import { expect, test } from "@playwright/test"
import fs from "node:fs/promises"
import path from "node:path"

const tenantId = "11111111-1111-4111-8111-111111111111"
const assetId = "22222222-2222-4222-8222-222222222222"
const asset = {
  id: assetId,
  slot: "logo",
  contentType: "image/png",
  width: 512,
  height: 512,
  bytes: 100,
}

test("upload and save retries retain the private draft; remove confirms and returns focus", async ({
  page,
}) => {
  let assets: (typeof asset)[] = []
  let failUpload = true
  let failSave = true
  let saves = 0

  await page.route("**/api/brand-assets?**", async (route) => {
    const request = route.request()
    const url = new URL(request.url())

    if (url.searchParams.has("assetId"))
      return route.fulfill({
        path: "public/design/photo-14.webp",
        contentType: "image/webp",
      })
    if (request.method() === "POST") {
      if (failUpload) {
        failUpload = false

        return route.fulfill({ status: 503 })
      }

      return route.fulfill({ status: 201, json: asset })
    }

    if (request.method() === "PUT") {
      saves++
      if (failSave) {
        failSave = false

        return route.fulfill({ status: 503 })
      }

      assets = [asset]

      return route.fulfill({ json: { ok: true } })
    }

    if (request.method() === "DELETE") {
      assets = []

      return route.fulfill({ json: { ok: true } })
    }

    return route.fulfill({ json: { storageAvailable: true, assets } })
  })
  await page.goto(`/en/brand-design-test?tenantId=${tenantId}`)
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )

  const logo = page.getByRole("region", { name: "Restaurant brand logo" })

  await logo.getByLabel("Choose Restaurant brand logo").setInputFiles({
    name: "logo.png",
    mimeType: "image/png",
    buffer: Buffer.from([137, 80, 78, 71]),
  })
  await expect(logo.getByRole("alert")).toBeVisible()
  await logo.getByRole("button", { name: "Try again" }).click()
  await expect(logo.getByText("Unsaved draft", { exact: true })).toBeVisible()
  await logo.getByRole("button", { name: "Save asset" }).click()
  await expect(logo.getByRole("alert")).toBeVisible()
  await expect(logo.getByText("Unsaved draft", { exact: true })).toBeVisible()
  await logo.getByRole("button", { name: "Save asset" }).click()
  await expect(logo.getByText("Asset saved. Storefront updated.")).toBeVisible()
  expect(saves).toBe(2)

  const remove = logo.getByRole("button", {
    name: "Remove Restaurant brand logo",
  })

  await remove.click()

  const dialog = page.getByRole("alertdialog")

  await expect(dialog).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(remove).toBeFocused()
  await remove.click()
  await dialog.getByRole("button", { name: "Remove", exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(logo.getByText("Fallback", { exact: true })).toBeVisible()
  await expect(
    logo.getByRole("button", { name: "Upload image", exact: true })
  ).toBeFocused()
})

for (const locale of ["en", "fr"]) {
  for (const width of [320, 375, 390, 768, 1024, 1440, 1920]) {
    for (const mode of ["light", "dark"] as const) {
      test(`${locale} brand layout at ${width}px in ${mode} supports text zoom and reduced motion`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 1000 })
        await page.emulateMedia({ reducedMotion: "reduce", colorScheme: mode })
        await page.addInitScript(
          (mode) => localStorage.setItem("theme", mode),
          mode
        )
        await page.route("**/api/brand-assets?**", (route) =>
          route.fulfill({ json: { storageAvailable: true, assets: [] } })
        )
        await page.goto(`/${locale}/brand-design-test?tenantId=${tenantId}`)
        await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
          "data-ready",
          "true"
        )
        await page.evaluate(() => {
          document.documentElement.style.fontSize = "200%"
        })
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          )
        ).toBe(true)

        const actions = page.getByRole("button", {
          name: locale === "en" ? "Upload image" : "Importer une image",
          exact: true,
        })

        await expect(actions).toHaveCount(3)
        for (const action of await actions.all()) {
          const box = await action.boundingBox()

          expect(box!.width).toBeGreaterThanOrEqual(44)
          expect(box!.height).toBeGreaterThanOrEqual(width >= 768 ? 48 : 44)
        }

        await page.evaluate(() => {
          document.documentElement.style.fontSize = ""
        })
        if (
          (locale === "fr" && width === 1440 && mode === "light") ||
          (locale === "en" && width === 390 && mode === "dark")
        ) {
          await page.addStyleTag({ content: "nextjs-portal { display: none }" })

          const directory = path.resolve(
            "../../docs/audits/assets/brand-assets"
          )

          await fs.mkdir(directory, { recursive: true })
          await page.screenshot({
            path: path.join(
              directory,
              width === 1440 ? "desktop-fr-light.png" : "mobile-en-dark.png"
            ),
            fullPage: true,
          })
        }
      })
    }
  }
}

test("a private draft survives offline save and preview failure", async ({
  page,
  context,
}) => {
  let assets: (typeof asset)[] = []
  let failPreview = true

  await page.route("**/api/brand-assets?**", async (route) => {
    const request = route.request()
    const url = new URL(request.url())

    if (url.searchParams.has("assetId")) {
      if (failPreview) return route.fulfill({ status: 503 })

      return route.fulfill({
        path: "public/design/photo-14.webp",
        contentType: "image/webp",
      })
    }

    if (request.method() === "POST")
      return route.fulfill({ status: 201, json: asset })
    if (request.method() === "PUT") {
      assets = [asset]

      return route.fulfill({ json: { ok: true } })
    }

    return route.fulfill({ json: { storageAvailable: true, assets } })
  })
  await page.goto(`/en/brand-design-test?tenantId=${tenantId}`)
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )

  const logo = page.getByRole("region", { name: "Restaurant brand logo" })

  await logo.getByLabel("Choose Restaurant brand logo").setInputFiles({
    name: "logo.png",
    mimeType: "image/png",
    buffer: Buffer.from([137, 80, 78, 71]),
  })
  await expect(
    logo.getByText("Preview could not be loaded. Your draft is kept.")
  ).toBeVisible()
  failPreview = false
  await logo.getByRole("button", { name: "Reload preview" }).click()
  await expect(
    logo.getByRole("img", { name: "Asset preview", exact: true })
  ).toBeVisible()
  await context.setOffline(true)
  await logo.getByRole("button", { name: "Save asset" }).click()
  await expect(
    logo.getByText(
      "You are offline. Your draft is kept; reconnect and try again."
    )
  ).toBeVisible()
  await expect(logo.getByText("Unsaved draft", { exact: true })).toBeVisible()
  await context.setOffline(false)
  await logo.getByRole("button", { name: "Save asset" }).click()
  await expect(logo.getByText("Asset saved. Storefront updated.")).toBeVisible()
})

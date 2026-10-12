import { expect, test } from "@playwright/test"
import path from "node:path"

test("saves normalized changes once, cancels, and preserves dirty values across refresh", async ({
  page,
}) => {
  await page.goto("/en/establishment-design-test")

  const name = page.getByLabel("Trade name")
  const save = page.getByRole("button", { name: "Save changes", exact: true })

  await expect(save).toBeDisabled()
  await name.fill(" Unsaved Bistro ")
  await page.getByRole("button", { name: "Background refresh" }).click()
  await expect(name).toHaveValue(" Unsaved Bistro ")
  await save.dblclick()
  await expect(page.getByText("Changes saved", { exact: true })).toBeVisible()
  await expect(name).toHaveValue("Unsaved Bistro")
  await expect(page.getByTestId("save-calls")).toHaveText("1")
  await name.fill("Other name")
  await page.getByRole("button", { name: "Cancel changes" }).click()
  await expect(name).toHaveValue("Unsaved Bistro")
})

test("rejects incomplete addresses and unpaired coordinates with accessible field errors", async ({
  page,
}) => {
  await page.goto("/en/establishment-design-test")
  await page.getByLabel("City", { exact: true }).fill("")
  await page.getByLabel("Longitude", { exact: true }).fill("")
  await page.getByRole("button", { name: "Save changes", exact: true }).click()
  await expect(page.getByLabel("City", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true"
  )
  await expect(page.getByLabel("Latitude", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true"
  )
  await expect(page.getByTestId("save-calls")).toHaveText("0")
})

test("conflicts preserve drafts until explicit discard and reload", async ({
  page,
}) => {
  await page.goto("/en/establishment-design-test?mode=conflict")
  await page.getByLabel("Trade name").fill("My draft")
  await page.getByRole("button", { name: "Save changes", exact: true }).click()
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "changed while you were editing"
  )
  await expect(page.getByLabel("Trade name")).toHaveValue("My draft")
  await page.getByRole("button", { name: "Reload latest settings" }).click()
  await expect(page.getByLabel("Trade name")).toHaveValue("My draft")
  await page.getByRole("button", { name: "Discard changes and reload" }).click()
  await expect(page.getByLabel("Trade name")).toHaveValue("Latest saved name")
  await expect(page.getByLabel("Pickup instructions — en")).toHaveCount(0)
})

test("an unavailable save retains input for retry and revoked access hides the form", async ({
  page,
}) => {
  await page.goto("/en/establishment-design-test?mode=offline")
  await page.getByLabel("Trade name").fill("Retained name")
  await page.getByRole("button", { name: "Save changes", exact: true }).click()
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Your edits have been kept"
  )
  await expect(page.getByLabel("Trade name")).toHaveValue("Retained name")
  await page.getByRole("button", { name: "Save changes", exact: true }).click()
  await expect(page.getByText("Changes saved", { exact: true })).toBeVisible()
  await page.goto("/en/establishment-design-test?mode=revoked")
  await page.getByLabel("Trade name").fill("Revoked")
  await page.getByRole("button", { name: "Save changes", exact: true }).click()
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "Access revoked"
  )
  await expect(page.getByLabel("Trade name")).toHaveCount(0)
})

test("protected query retry recovers and a revoked background read clears the editor", async ({
  page,
}) => {
  let fail = true
  let revoked = false
  const settings = {
    name: "Authorized Bistro",
    phone: null,
    addressLine1: null,
    addressLine2: null,
    postalCode: null,
    city: null,
    region: null,
    countryCode: null,
    latitude: null,
    longitude: null,
    timeZone: "UTC",
    pickupInstructions: { en: "Counter" },
    locales: ["en"],
    defaultLocale: "en",
    establishmentVersion: 1,
  }

  await page.route("**/api/establishment-settings?**", async (route) => {
    if (revoked) return route.fulfill({ status: 404 })
    if (fail) return route.fulfill({ status: 503 })

    return route.fulfill({
      json: { settings, options: { timeZones: ["UTC"], countries: ["FR"] } },
    })
  })
  await page.goto("/en/establishment-design-test?mode=query")
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "unavailable"
  )
  fail = false
  await page.getByRole("button", { name: "Retry", exact: true }).click()
  await expect(page.getByLabel("Trade name")).toHaveValue("Authorized Bistro")
  await page.getByLabel("Trade name").fill("Private draft")
  revoked = true
  await page.evaluate(() => window.dispatchEvent(new Event("visibilitychange")))
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "no longer have access"
  )
  await expect(page.getByLabel("Trade name")).toHaveCount(0)
})

test("current pickup failures leave the confirmed receipt and totals visible", async ({
  page,
}) => {
  let calls = 0

  await page.route("**/api/public/establishment?**", async (route) => {
    expect(new URL(route.request().url()).searchParams.get("locale")).toBe("fr")
    calls++
    await route.fulfill({ status: 503 })
  })
  await page.goto("/en/establishment-design-test?mode=receipt")
  await expect(
    page.getByRole("heading", { name: "Order confirmed" })
  ).toBeVisible()
  await expect(page.getByText("€13.20", { exact: true })).toBeVisible()
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Your order details remain available"
  )

  const beforeRetry = calls

  await page
    .getByRole("button", { name: "Retry collection information" })
    .click()
  await expect.poll(() => calls).toBeGreaterThan(beforeRetry)
})

for (const locale of ["en", "fr"]) {
  test(`${locale} settings remain within the viewport at all requested sizes and 200% zoom`, async ({
    page,
  }) => {
    for (const width of [320, 375, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 950 })
      await page.goto(`/${locale}/establishment-design-test`)
      await expect(page.locator("#est-name")).toBeVisible()
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      ).toBe(true)
      if (width === 768)
        expect(
          (await page.locator("#est-name").boundingBox())!.height
        ).toBeGreaterThanOrEqual(48)
      if (
        process.env.WHITEPLATE_DESIGN_SCREENSHOTS &&
        [390, 1440].includes(width)
      )
        await page.screenshot({
          path: path.join(
            process.env.WHITEPLATE_DESIGN_SCREENSHOTS,
            `${locale}-light-${width}.png`
          ),
          fullPage: true,
        })
    }

    await page.evaluate(() => {
      document.body.style.zoom = "2"
    })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true)
    await page.locator("#est-name").focus()
    await page.keyboard.press("Tab")
    await expect(page.locator("#est-phone")).toBeFocused()
  })
}

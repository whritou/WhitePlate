import { expect, test } from "@playwright/test"
import { DEFAULT_THEME } from "../../lib/lovable/storeTheme"
import { themeAppearance } from "../../lib/validation/theme-appearance"

test("real Studio saves server drafts, reloads them and retains edits after a stale save", async ({
  page,
}) => {
  let saved = { theme: themeAppearance(DEFAULT_THEME), version: 1 }
  let reject = false
  const writes: unknown[] = []

  await page.route("**/api/theme-settings?**", async (route) => {
    if (new URL(route.request().url()).searchParams.has("palette"))
      return route.fulfill({ json: { palette: null, reason: "no_logo" } })
    if (route.request().method() === "PUT") {
      writes.push(route.request().postDataJSON())
      if (reject)
        return route.fulfill({ status: 412, json: { error: "conflict" } })

      const input = route.request().postDataJSON()

      saved = { theme: input.theme, version: saved.version + 1 }
    }

    return route.fulfill({ json: saved })
  })
  await page.goto(
    "/en/live-workspace-test?view=studio&tenantId=22222222-2222-4222-8222-222222222222"
  )
  await page.getByLabel("Primary color", { exact: true }).fill("#123456")
  await page.getByRole("button", { name: "Save draft", exact: true }).click()
  await expect.poll(() => writes.length).toBe(1)
  expect(writes[0]).toMatchObject({ theme: { primary: "#123456" }, version: 1 })
  expect(writes[0]).not.toHaveProperty("theme.logo")
  await page.reload()
  await expect(page.getByLabel("Primary color", { exact: true })).toHaveValue(
    "#123456"
  )
  reject = true
  await page.getByLabel("Primary color", { exact: true }).fill("#654321")
  await page.getByRole("button", { name: "Save draft", exact: true }).click()
  await expect(
    page.getByRole("status").filter({ hasText: "another session" })
  ).toBeVisible()
  await expect(page.getByLabel("Primary color", { exact: true })).toHaveValue(
    "#654321"
  )
  await expect(
    page.getByRole("button", { name: "Save draft", exact: true })
  ).toBeEnabled()
  await page
    .getByRole("button", { name: "Reload saved draft", exact: true })
    .click()
  await expect(page.getByLabel("Primary color", { exact: true })).toHaveValue(
    "#123456"
  )
})

for (const locale of ["en", "fr"])
  test(`${locale}: existing Studio controls, logo preset and preview fit narrow and wide screens`, async ({
    page,
  }, testInfo) => {
    const draft = { theme: themeAppearance(DEFAULT_THEME), version: 1 }

    await page.route("**/api/theme-settings?**", (route) =>
      route.fulfill({
        json: new URL(route.request().url()).searchParams.has("palette")
          ? {
              palette: {
                primary: "#123456",
                accent: "#abcdef",
                bg: "#ffffff",
                text: "#111111",
              },
              reason: null,
            }
          : draft,
      })
    )
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(
        `/${locale}/live-workspace-test?view=studio&tenantId=22222222-2222-4222-8222-222222222222`
      )
      await page
        .getByRole("button", {
          name: locale === "en" ? "From your logo" : "Depuis votre logo",
          exact: true,
        })
        .click()
      await expect(page.locator('input[type="color"]').first()).toHaveValue(
        "#123456"
      )
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true)
      await expect(page.locator(".lovable-live").first()).toHaveCSS(
        "font-family",
        /Space Grotesk/
      )
      if (locale === "en" && [390, 1440].includes(width))
        await page.screenshot({
          path: testInfo.outputPath(`studio-${width}.png`),
          fullPage: true,
        })
    }
  })

test("theme transport failure retains edits and denied reads hide the editor", async ({
  page,
}) => {
  let denied = false

  await page.route("**/api/theme-settings?**", async (route) => {
    if (route.request().method() === "PUT")
      return route.fulfill({ status: 503, json: { error: "unavailable" } })
    if (denied)
      return route.fulfill({ status: 404, json: { error: "not_found" } })

    return route.fulfill({
      json: new URL(route.request().url()).searchParams.has("palette")
        ? { palette: null, reason: "unusable" }
        : { theme: themeAppearance(DEFAULT_THEME), version: 1 },
    })
  })
  await page.goto(
    "/en/live-workspace-test?view=studio&tenantId=22222222-2222-4222-8222-222222222222"
  )
  await page.getByLabel("Primary color", { exact: true }).fill("#123456")
  await page.getByRole("button", { name: "Save draft", exact: true }).click()
  await expect(
    page.getByRole("status").filter({ hasText: "could not be saved" })
  ).toBeVisible()
  await expect(page.getByLabel("Primary color", { exact: true })).toHaveValue(
    "#123456"
  )
  denied = true
  await page
    .getByRole("button", { name: "Reload saved draft", exact: true })
    .click()
  await expect(page.getByLabel("Primary color", { exact: true })).toHaveCount(0)
})

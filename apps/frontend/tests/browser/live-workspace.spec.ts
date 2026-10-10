import { expect, test } from "@playwright/test"

const organizationId = "11111111-1111-4111-8111-111111111111"
const tenantId = "22222222-2222-4222-8222-222222222222"
const fixture = (view: string, extra = "") =>
  `/en/live-workspace-test?view=${view}&organizationId=${organizationId}${extra}`

for (const locale of ["en", "fr"])
  test(`${locale}: real workspace fixtures keep Lovable tokens and fit mobile, tablet and desktop`, async ({
    page,
  }) => {
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      for (const view of [
        "settings",
        "studio",
        "dashboard",
        "analytics",
        "store",
      ]) {
        await page.goto(fixture(view).replace("/en/", `/${locale}/`))
        await expect(page.locator("h1").first()).toBeVisible()
        await page.evaluate(() => document.fonts.ready)
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          ),
          `${view} ${width}`
        ).toBe(true)
        await expect(page.locator(".lovable-live").first()).toHaveCSS(
          "font-family",
          /Space Grotesk/
        )
      }
    }
  })

test("settings retain the organization context and disclose disconnected payments", async ({
  page,
}) => {
  await page.goto(fixture("settings", "&section=payments"))
  await expect(page.getByText(/Fictitious data/)).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Connect Stripe", exact: true })
  ).toBeDisabled()
  await page.getByRole("button", { name: /Organization Company/ }).click()
  await expect(
    page.getByLabel("Organization name", { exact: true })
  ).toHaveValue("Maison Verte")
  await expect(page).toHaveURL(
    new RegExp(`organizationId=${organizationId}.*section=org`)
  )
})

test("local settings drafts cannot leak into another account or demo storage", async ({
  page,
}) => {
  await page.goto(fixture("settings", "&section=billing"))
  await page.getByRole("button", { name: /Switch Starter/ }).click()
  await page.getByRole("button", { name: "Save local draft" }).click()
  await expect(
    page.getByText("Local draft saved. No backend changes.")
  ).toBeVisible()

  const drafts = await page.evaluate(() => ({
    live: localStorage.getItem(
      "whiteplate-live-draft:fixture-a:11111111-1111-4111-8111-111111111111:settings"
    ),
    demo: localStorage.getItem("whiteplate-lovable-demo-settings-v1"),
  }))

  expect(JSON.parse(drafts.live!).plan).toBe("starter")
  expect(drafts.demo).toBeNull()
  await page.goto(fixture("settings", "&section=billing&user=b"))
  await expect(
    page.getByRole("button", { name: /Current plan Pro/ })
  ).toBeVisible()
})

test("real catalogue editor portals inherit the source palette and Escape behavior", async ({
  page,
}) => {
  await page.goto(
    `/en/catalog-design-test?view=builder&shell=1&tenantId=11111111-1111-4111-8111-111111111111`
  )
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )

  const trigger = page
    .getByRole("button", { name: "New product", exact: true })
    .first()

  await trigger.click()

  const dialog = page.getByRole("dialog").last()

  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveClass(/lovable-live/)
  await expect(dialog).toHaveCSS("border-top-left-radius", "0px")
  await expect(dialog).toHaveCSS("font-family", /Space Grotesk/)
  await page.keyboard.press("Escape")
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test("workspace context selection keeps real URLs and does not navigate into demo pages", async ({
  page,
}) => {
  await page.goto(
    fixture("dashboard").replace(
      `organizationId=${organizationId}`,
      `tenantId=${tenantId}`
    )
  )

  const navigation = page.getByRole("navigation", {
    name: "Workspace navigation",
    exact: true,
  })

  await expect(
    navigation.getByRole("link", { name: /Orders/, exact: false }).first()
  ).toHaveAttribute("href", `/en/organization/orders?tenantId=${tenantId}`)
  expect(await navigation.locator('a[href*="/demo"]').count()).toBe(0)
  await page.goto("/en/organization/dashboard?tenantId=" + tenantId)
  await expect(page).toHaveURL(/\/en\/sign-in/)
})

test("the real customer basket keeps product quantities and scoped dialog styling", async ({
  page,
}) => {
  const writes: string[] = []

  page.on("request", (request) => {
    if (request.url().includes("/api/") && request.method() !== "GET")
      writes.push(request.url())
  })
  await page.setViewportSize({ width: 390, height: 900 })
  await page.goto(fixture("store"))
  await page
    .getByRole("button", {
      name: "Add Burrata & tomates anciennes",
      exact: true,
    })
    .click()

  const product = page.getByRole("dialog")

  await product
    .getByLabel("Quantity for Burrata & tomates anciennes", { exact: true })
    .fill("2")
  await product
    .getByRole("button", {
      name: "Add Burrata & tomates anciennes",
      exact: true,
    })
    .click()

  const basket = page.getByRole("button", { name: /View order · 2 items/ })

  await expect(basket).toBeVisible()
  await basket.click()

  const dialog = page.getByRole("dialog")

  await expect(dialog).toHaveClass(/customer-page/)
  await expect(
    dialog.getByLabel("Quantity for Burrata & tomates anciennes", {
      exact: true,
    })
  ).toHaveValue("2")
  await page.keyboard.press("Escape")
  await expect(dialog).toHaveCount(0)
  await expect(basket).toBeFocused()
  expect(writes).toEqual([])
})

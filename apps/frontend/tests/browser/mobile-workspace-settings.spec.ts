import { expect, test } from "@playwright/test"

test("mobile menu actions stay compact and dialogs remain clickable above them", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 720 })
  await page.goto("/en/catalog-design-test?view=builder")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )

  const selector = page.getByRole("button", {
    name: "Select Salade de tomates anciennes et burrata",
    exact: true,
  })

  await page.evaluate(() => window.scrollTo(0, 0))
  await selector.evaluate((element: HTMLButtonElement) => element.click())
  await expect(selector).toHaveAttribute("aria-pressed", "true")
  await expect(selector).toBeInViewport()

  const categoryAction = page.getByRole("button", {
    name: "Manage categories",
  })
  const save = page.getByRole("button", { name: "Save changes", exact: true })

  expect((await categoryAction.boundingBox())?.height).toBeLessThanOrEqual(42)
  expect((await save.boundingBox())?.height).toBeLessThanOrEqual(42)

  await categoryAction.click()

  const dialog = page.getByRole("dialog", { name: "Manage categories" })

  await expect(dialog).toBeVisible()

  const hide = dialog.getByRole("button", {
    name: "Hide category Les entrées",
  })

  await hide.scrollIntoViewIfNeeded()
  await expect(hide).toBeInViewport()
  await expect(dialog.getByRole("button", { name: "Close" })).toBeInViewport()
  expect(
    await hide.evaluate((element) => {
      const bounds = element.getBoundingClientRect()
      const hit = document.elementFromPoint(
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height / 2
      )

      return hit === element || element.contains(hit)
    })
  ).toBe(true)
})

test("mobile organization settings reveal the chosen section and keep hover contrast", async ({
  page,
}) => {
  const organizationId = "11111111-1111-4111-8111-111111111111"

  await page.setViewportSize({ width: 390, height: 700 })
  await page.goto(
    `/en/live-workspace-test?view=settings&organizationId=${organizationId}&section=org`
  )

  const navigation = page.getByRole("complementary", {
    name: "Settings sections",
  })
  const billing = navigation.getByRole("button", { name: /Plan & billing/ })

  await billing.click()
  await expect(billing).toHaveAttribute("aria-current", "page")
  await expect(
    page.getByRole("heading", { name: "Subscription", exact: true })
  ).toBeInViewport()
  await expect(navigation).toHaveCSS("position", "sticky")

  await page.setViewportSize({ width: 1440, height: 900 })

  const organization = navigation.getByRole("button", { name: /Organization/ })
  const themeColors = await page
    .locator(".live-settings")
    .evaluate((element) => {
      const styles = getComputedStyle(element)

      return {
        activeBackground: styles.getPropertyValue("--foreground").trim(),
        activeText: styles.getPropertyValue("--background").trim(),
        hoverBackground: styles.getPropertyValue("--secondary").trim(),
        hoverText: styles.getPropertyValue("--secondary-foreground").trim(),
      }
    })

  await billing.hover()
  await expect(billing).toHaveCSS(
    "background-color",
    themeColors.activeBackground
  )
  await expect(billing).toHaveCSS("color", themeColors.activeText)
  await organization.hover()
  await expect(organization).toHaveCSS(
    "background-color",
    themeColors.hoverBackground
  )
  await expect(organization).toHaveCSS("color", themeColors.hoverText)
})

test("restaurant settings mobile category selector updates the URL and selected panel", async ({
  page,
}) => {
  const tenantId = "22222222-2222-4222-8222-222222222222"

  await page.setViewportSize({ width: 390, height: 700 })
  await page.goto(
    `/en/live-workspace-test?view=restaurant-settings&tenantId=${tenantId}&section=legal`
  )

  const category = page.getByRole("combobox", {
    name: "Restaurant settings categories",
  })

  await expect(category).toHaveValue("legal")
  await expect(
    page.getByRole("heading", { name: "Legal and tax profile" })
  ).toBeVisible()

  await category.selectOption("hours")
  await expect(page).toHaveURL(/section=hours/)
  await expect(category).toHaveValue("hours")
})

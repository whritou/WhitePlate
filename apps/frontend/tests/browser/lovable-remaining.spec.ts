import { expect, test } from "@playwright/test"

for (const locale of ["en", "fr"]) {
  test(`${locale}: account flows use the Lovable frame and remain accessible`, async ({
    page,
  }) => {
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      for (const route of [
        "sign-in",
        "sign-up",
        "forgot-password",
        "reset-password",
        "verify-email",
        "invitations/accept",
      ]) {
        await page.goto(`/${locale}/${route}`)
        await expect(page.locator("h1").first()).toBeVisible()
        await expect(page.locator(".lovable-auth")).toBeVisible()
        await page.evaluate(() => document.fonts.ready)
        await expect(page.locator(".lovable-auth")).toHaveCSS(
          "font-family",
          /Space Grotesk/
        )
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          )
        ).toBe(true)
      }
    }
  })
}

test("the real team uses member tables while keeping invitation actions", async ({
  page,
}) => {
  await page.goto(
    "/en/live-workspace-test?view=team&organizationId=11111111-1111-4111-8111-111111111111"
  )
  await expect(page.getByRole("table").first()).toBeVisible()
  await expect(
    page.getByText("manager@example.test", { exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: /Revoke/ }).first()
  ).toBeVisible()
})

test("checkout uses the source customer composition and preserves real guest controls", async ({
  page,
}) => {
  await page.goto("/en/live-workspace-test?view=store&step=checkout")
  await expect(page.locator(".live-checkout-layout")).toBeVisible()
  await expect(page.locator(".live-checkout-illustration")).toHaveCount(0)
  await expect(page.getByRole("heading").first()).toBeVisible()
})

test("source checkout keeps real cart editing and guest identity", async ({
  page,
}) => {
  const writes: string[] = []

  page.on("request", (request) => {
    if (request.url().includes("/api/") && request.method() !== "GET")
      writes.push(request.url())
  })
  await page.goto("/en/live-workspace-test?view=store")
  await page
    .getByRole("button", {
      name: "Add Burrata & tomates anciennes",
      exact: true,
    })
    .click()
  await page
    .getByRole("dialog")
    .getByRole("button", {
      name: "Add Burrata & tomates anciennes",
      exact: true,
    })
    .click()
  await page
    .getByRole("link", { name: "Fixture checkout", exact: true })
    .click()

  const form = page.locator(".live-checkout-layout")

  await expect(form.getByLabel("Your name", { exact: true })).toBeVisible()
  await form.getByLabel("Your name", { exact: true }).fill("Ada")
  await form
    .getByLabel("Quantity for Burrata & tomates anciennes", { exact: true })
    .fill("2")
  await expect(form).toContainText("€22.00")
  await expect(
    form.getByRole("button", { name: "Place order", exact: true })
  ).toBeEnabled()
  expect(writes).toEqual([])
})

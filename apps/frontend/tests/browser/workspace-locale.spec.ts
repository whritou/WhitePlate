import { expect, test } from "@playwright/test"

test("workspace language selector shows country flags and preserves the route", async ({
  page,
}) => {
  await page.goto("/en/design-system-test?organizationId=design-fixture")

  const languageGroup = page.getByRole("group", { name: "Language" })
  const languageButton = page.locator("#workspace-language-btn")

  await expect(languageGroup).toBeVisible()
  await expect(languageButton).toContainText("English")
  await expect(
    page.getByTestId("workspace-language-selected-flag")
  ).toBeVisible()

  await languageButton.click()
  await expect(page.getByRole("listbox")).toBeVisible()
  await page.getByRole("option", { name: "French" }).click()

  await expect(page).toHaveURL(
    /\/fr\/design-system-test\?organizationId=design-fixture/
  )
  await expect(page.locator("#workspace-language-btn")).toContainText(
    "Français"
  )
})

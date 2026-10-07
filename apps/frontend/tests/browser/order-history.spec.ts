import { expect, test } from "@playwright/test"

test("mobile history filters open in a Sheet while the table stays visible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 844 })
  await page.goto("/en/order-history-test")

  await expect(page.getByRole("button", { name: "Filters" })).toBeVisible()
  await expect(page.locator('[data-slot="table"]')).toBeVisible()

  await page.getByRole("button", { name: "Filters" }).click()

  const filtersSheet = page.getByRole("dialog")

  await expect(filtersSheet).toBeVisible()
  await expect(
    filtersSheet.getByRole("textbox", { name: "Customer or reference" })
  ).toBeVisible()
  await expect(filtersSheet.getByLabel("Status")).toBeVisible()
  await expect(filtersSheet.getByLabel("From")).toBeVisible()
  await expect(filtersSheet.getByLabel("Through")).toBeVisible()

  await page.keyboard.press("Escape")
  await expect(filtersSheet).toBeHidden()
})

test("desktop history filters align their actions on the right and submit search criteria", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto("/en/order-history-test")

  const form = page.locator('[data-filter-form="desktop"]')

  await expect(form).toBeVisible()
  await expect(page.getByRole("button", { name: /^Filters$/ })).toBeHidden()

  const geometry = await form.evaluate((element) => {
    const bounds = (selector: string) => {
      const rect = element.querySelector(selector)!.getBoundingClientRect()

      return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom }
    }

    return {
      through: bounds("#history-through-desktop"),
      actions: bounds("[data-filter-actions]"),
    }
  })

  expect(geometry.actions.x).toBeGreaterThanOrEqual(geometry.through.right)
  expect(
    Math.abs(geometry.actions.bottom - geometry.through.bottom)
  ).toBeLessThanOrEqual(2)

  await form
    .getByRole("textbox", { name: "Customer or reference" })
    .fill("Ada Lovelace")
  await form.getByRole("button", { name: "Apply filters" }).click()
  await expect(page).toHaveURL(/search=Ada\+Lovelace/)
})

test("history pagination exposes compact first and last page controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto("/en/order-history-test")

  await expect(page.getByRole("link", { name: "Last page" })).toHaveAttribute(
    "href",
    /page=3/
  )
  await expect(page.getByRole("button", { name: "First page" })).toBeDisabled()
  await expect(page.getByRole("button", { name: "Previous" })).toBeDisabled()

  const firstPageControl = page.getByRole("button", { name: "First page" })
  const previousControl = page.getByRole("button", { name: "Previous" })
  const nextPageControl = page.getByRole("link", { name: "Next" })
  const lastPageControl = page.getByRole("link", { name: "Last page" })

  await expect(firstPageControl).toHaveAttribute("data-slot", "button")
  await expect(previousControl).toHaveAttribute("data-slot", "button")
  await expect(nextPageControl).toHaveAttribute("href", /page=2/)
  await expect(lastPageControl).toHaveAttribute("href", /page=3/)
})

import { expect, test } from "@playwright/test"

test("announces success politely, preserves focus, and supports keyboard dismissal", async ({
  page,
}) => {
  await page.goto("/en/workspace-toast-test")

  const trigger = page.getByRole("button", { name: "Show success toast" })
  const toast = page.getByRole("dialog", { name: "Changes saved." })

  await trigger.focus()
  await trigger.press("Enter")

  await expect(toast).toContainText("Changes saved.")
  await expect(trigger).toBeFocused()

  await trigger.press("Tab")
  await expect(toast).toBeFocused()

  const dismiss = page.getByRole("button", {
    name: "Dismiss notification",
  })

  await dismiss.focus()
  await dismiss.press("Enter")
  await expect(toast).toHaveCount(0)
})

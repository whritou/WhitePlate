import { parityCaptureOptions } from "./pixel-parity"
import { expect, type Page, type TestInfo } from "@playwright/test"

export async function exerciseUncertainCheckout(
  page: Page,
  testInfo: TestInfo,
  width: number
) {
  const attempts: string[] = []

  await page.route("**/fr/studio-parity-test**", (route) => {
    if (route.request().method() !== "POST") return route.continue()
    attempts.push(route.request().postData() ?? "")

    return route.abort("failed")
  })
  await page.locator("#customer-phone").fill("123456789012345678901")
  await page.locator('button[type="submit"]').click()
  await expect(page.locator(".customer-summary [role=alert]")).toBeVisible()
  expect(attempts).toHaveLength(0)
  await page.locator("#customer-phone").fill("+33123456789")
  await page.locator('button[type="submit"]').click()

  const retry = page.getByRole("button", {
    name: "Vérifier et réessayer cette commande",
    exact: true,
  })

  await expect(retry).toBeVisible()
  await expect(page.locator("#customer-phone")).toBeDisabled()
  await page.screenshot({
    path: testInfo.outputPath(`checkout-${width}-uncertain.png`),
    fullPage: true,
    ...parityCaptureOptions,
  })
  await retry.click()
  await expect.poll(() => attempts.length).toBe(2)
  expect(attempts[1]).toBe(attempts[0])
}

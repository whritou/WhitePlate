import { expect, test } from "@playwright/test"

test("checkout fits the narrow mobile viewport without page overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto("/fr/demo/checkout")

  const widths = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }))

  expect(widths.scroll).toBeLessThanOrEqual(widths.client)
})

test("mobile menu category controls stay within their navigation area", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto("/fr/demo")

  const nav = page.locator("main nav").first()
  const navBounds = await nav.boundingBox()
  const buttonBounds = await nav.getByRole("button").evaluateAll((buttons) =>
    buttons.map((button) => {
      const bounds = button.getBoundingClientRect()

      return { left: bounds.left, right: bounds.right }
    })
  )

  expect(navBounds).not.toBeNull()
  expect(
    buttonBounds.every(
      (bounds) =>
        bounds.left >= navBounds!.x &&
        bounds.right <= navBounds!.x + navBounds!.width
    )
  ).toBe(true)
})

test("mobile app bar keeps the restaurant brand mark without its wide wordmark", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto("/fr/demo")

  await expect(
    page.locator("header").getByText("WhitePlate", { exact: true })
  ).toBeHidden()

  await page.setViewportSize({ width: 1280, height: 900 })

  await expect(
    page.locator("header").getByText("WhitePlate", { exact: true })
  ).toBeVisible()
})

test("mobile checkout and tracking routes do not extend past the page width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })

  for (const route of ["/fr/demo/checkout", "/fr/demo/tracking"]) {
    await page.goto(route)

    const widths = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }))

    expect(widths.scroll, route).toBeLessThanOrEqual(widths.client)
  }
})

test("mobile tracking summary stacks its code and actions for readable copy", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto("/fr/demo/tracking")

  const pinCard = page.locator("main section.tracking-hero [data-slot=card]")
  const code = await pinCard.locator(":scope > div").first().boundingBox()
  const actions = await pinCard.locator(":scope > div").nth(1).boundingBox()

  expect(code).not.toBeNull()
  expect(actions).not.toBeNull()
  expect(actions!.y).toBeGreaterThanOrEqual(code!.y + code!.height)
})

test("mobile dashboard puts prep timing below the order acceptance status", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto("/fr/demo/dashboard")

  const statusRow = page.locator("main header p").first()
  const status = await statusRow.locator("span").first().boundingBox()
  const prepTime = await statusRow.locator("span").last().boundingBox()

  expect(status).not.toBeNull()
  expect(prepTime).not.toBeNull()
  expect(prepTime!.y).toBeGreaterThanOrEqual(status!.y + 12)
})

test("marketing, menu, tracking and dashboard fit mobile, tablet and desktop widths", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 })

    for (const route of [
      "/fr",
      "/en",
      "/fr/demo",
      "/en/demo",
      "/fr/demo/checkout",
      "/fr/demo/tracking",
      "/fr/demo/dashboard",
      "/fr/catalog-design-test",
      "/fr/order-history-test",
      "/fr/orders-kanban-test",
    ]) {
      await page.goto(route)

      const dimensions = await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
      }))

      expect(dimensions.scroll, `${route} at ${width}px`).toBeLessThanOrEqual(
        dimensions.client
      )
    }
  }
})

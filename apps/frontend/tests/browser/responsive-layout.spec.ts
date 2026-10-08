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

test("mobile menu categories scroll locally without widening the page", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto("/fr/demo")

  const nav = page.locator("main nav").first()
  const navBounds = await nav.boundingBox()
  const widths = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }))

  expect(navBounds).not.toBeNull()
  expect(navBounds!.width).toBeLessThanOrEqual(widths.client - 32)
  expect(widths.scroll).toBeLessThanOrEqual(widths.client)
  await nav.getByRole("button").last().focus()
  await expect(nav.getByRole("button").last()).toBeInViewport()
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

test("mobile landing hero keeps its headline and primary action compact", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto("/fr")

  const title = page.locator("main h1").first()
  const join = page.getByRole("link", { name: /Rejoignez WhitePlate/ })

  expect(
    await title.evaluate((element) => getComputedStyle(element).fontSize)
  ).toBe("26px")
  expect(
    await join.evaluate((element) => getComputedStyle(element).fontSize)
  ).toBe("14px")
})

test("mobile pricing toggle and popular badge stay centered in their containers", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto("/fr")

  const toggle = await page.locator("#billing-toggle").boundingBox()
  const pricing = await page.locator("#pricing").boundingBox()
  const card = page.locator("#pricing [class*=ring-2]")
  const cardBounds = await card.boundingBox()
  const badge = await card.locator(":scope > div").first().boundingBox()

  expect(toggle).not.toBeNull()
  expect(pricing).not.toBeNull()
  expect(
    Math.abs(toggle!.x + toggle!.width / 2 - (pricing!.x + pricing!.width / 2))
  ).toBeLessThanOrEqual(8)
  expect(badge).not.toBeNull()
  expect(cardBounds).not.toBeNull()
  expect(badge!.x).toBeGreaterThanOrEqual(cardBounds!.x + 8)
  expect(badge!.x + badge!.width).toBeLessThanOrEqual(
    cardBounds!.x + cardBounds!.width - 8
  )
  expect(
    Math.abs(
      badge!.x + badge!.width / 2 - (cardBounds!.x + cardBounds!.width / 2)
    )
  ).toBeLessThanOrEqual(2)
  expect(badge!.y).toBeGreaterThanOrEqual(cardBounds!.y)
})

test("mobile landing checkout summary stacks its total and payment action", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto("/fr")
  await page.getByRole("button", { name: "Vitrine client" }).click()

  const payment = page.getByRole("button", { name: /Payer avec Apple Pay/ })
  const total = page.getByText("Total : 38,50 $")
  const paymentBounds = await payment.boundingBox()
  const totalBounds = await total.boundingBox()
  const summary = await total.locator("../..").boundingBox()

  expect(paymentBounds).not.toBeNull()
  expect(totalBounds).not.toBeNull()
  expect(summary).not.toBeNull()
  expect(paymentBounds!.y).toBeGreaterThan(totalBounds!.y)
  expect(paymentBounds!.width).toBeLessThanOrEqual(summary!.width)
  expect(paymentBounds!.x + paymentBounds!.width).toBeLessThanOrEqual(
    summary!.x + summary!.width
  )
  expect(
    await payment.evaluate((element) => getComputedStyle(element).fontSize)
  ).toBe("12px")
})

test("landing metrics stay centered and use restrained number sizing on desktop", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto("/fr")

  const number = page.getByText("0%", { exact: true })

  await expect(number).toBeVisible()
  expect(
    await number.evaluate((element) => getComputedStyle(element).fontSize)
  ).toBe("24px")
  expect(
    await number.evaluate((element) => getComputedStyle(element).textAlign)
  ).toBe("center")
})

test("mobile live-order preview heading and refresh status get separate space", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto("/fr")

  const title = page.getByText("Tableau de commandes en direct", {
    exact: true,
  })
  const status = page.getByText("Actualisation active", { exact: true })
  const titleBounds = await title.boundingBox()
  const statusBounds = await status.boundingBox()

  expect(titleBounds).not.toBeNull()
  expect(statusBounds).not.toBeNull()
  expect(statusBounds!.y).toBeGreaterThanOrEqual(
    titleBounds!.y + titleBounds!.height
  )
  expect(
    await title.evaluate((element) => getComputedStyle(element).fontSize)
  ).toBe("15px")
})

import { expect, test } from "@playwright/test"

test("menu add actions keep a comfortable inset from every product card edge", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto("/fr/demo")
  await expect(page.locator("main h1")).toBeVisible()

  const insets = await page
    .locator("main [data-slot=card]")
    .filter({ has: page.locator("h3") })
    .evaluateAll((cards) =>
      cards
        .filter((card) => card.querySelector("[data-slot=card-footer]"))
        .map((card) => {
          const bounds = card.getBoundingClientRect()
          const action = card
            .querySelector("[data-slot=card-footer] button")!
            .getBoundingClientRect()

          return {
            bottom: bounds.bottom - action.bottom,
            right: bounds.right - action.right,
          }
        })
    )

  expect(insets).toHaveLength(6)
  for (const inset of insets) {
    expect(inset.bottom).toBeGreaterThanOrEqual(16)
    expect(inset.right).toBeGreaterThanOrEqual(16)
  }
})

test("hero actions share their height and give localized labels room at tablet width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 })
  await page.goto("/fr")
  await expect(page.locator("main h1")).toBeVisible()

  const join = await page
    .getByRole("link", { name: /Rejoignez WhitePlate/ })
    .boundingBox()
  const demo = await page.locator("#hero-quick-demo-btn").boundingBox()

  expect(join).not.toBeNull()
  expect(demo).not.toBeNull()
  expect(Math.abs(join!.height - demo!.height)).toBeLessThanOrEqual(1)
  expect(join!.height).toBeLessThanOrEqual(80)
})

test("kitchen preview metrics contain their values in the desktop hero", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 })
  await page.goto("/fr")
  await expect(page.locator("main h1")).toBeVisible()

  const overflow = await page
    .locator("#view-backoffice > div")
    .first()
    .evaluate((grid) =>
      [...grid.children].flatMap((card) =>
        [...card.querySelectorAll("span")]
          .filter((value) => {
            const parent = card.getBoundingClientRect()
            const child = value.getBoundingClientRect()

            return (
              child.right > parent.right - 8 || child.left < parent.left + 8
            )
          })
          .map((value) => value.textContent)
      )
    )

  expect(overflow).toEqual([])
})

test("header locale links are comfortable touch targets", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto("/fr")
  await expect(page.locator("main h1")).toBeVisible()

  for (const language of ["en", "fr"]) {
    const bounds = await page
      .locator(`header a[lang=${language}]`)
      .boundingBox()

    expect(bounds!.width).toBeGreaterThanOrEqual(44)
    expect(bounds!.height).toBeGreaterThanOrEqual(44)
  }
})

test("mobile menu filters leave room to browse products", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto("/fr/demo")
  await expect(page.locator("main h1")).toBeVisible()

  const nav = page.locator("main nav").first()
  const bounds = await nav.boundingBox()

  expect(bounds!.height).toBeLessThanOrEqual(64)

  const clippedLabels = await nav
    .getByRole("button")
    .evaluateAll((buttons) =>
      buttons
        .filter((button) => button.scrollWidth > button.clientWidth + 1)
        .map((button) => button.textContent)
    )

  expect(clippedLabels).toEqual([])
  await nav.getByRole("button").last().click()
  await expect(nav.getByRole("button").last()).toHaveAttribute(
    "aria-pressed",
    "true"
  )
  await expect(
    page.getByRole("heading", { name: "Milkshake caramel salé croustillant" })
  ).toBeVisible()
})

test("marketing navigation closes on Escape and restores focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto("/fr")
  await expect(page.locator("main h1")).toBeVisible()

  const trigger = page.locator(
    "header button[aria-controls=marketing-mobile-navigation]"
  )

  await trigger.click()
  await expect(trigger).toHaveAttribute("aria-expanded", "true")
  await page.locator("#marketing-mobile-navigation a").first().focus()
  await page.keyboard.press("Escape")
  await expect(trigger).toHaveAttribute("aria-expanded", "false")
  await expect(trigger).toBeFocused()
})

test("mobile cart shortcut stays inset and takes shoppers to their order", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.goto("/fr/demo")
  await expect(page.locator("main h1")).toBeVisible()

  const shortcut = page.getByRole("link", {
    name: /Votre commande à emporter.*3 articles/,
  })

  await expect(shortcut).toBeVisible()

  const bounds = await shortcut.boundingBox()

  expect(bounds!.x).toBeGreaterThanOrEqual(16)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(304)
  await shortcut.click()
  await expect(page.locator("#demo-cart h2")).toBeInViewport()
})

for (const locale of ["en", "fr"]) {
  for (const theme of ["light", "dark"]) {
    test(`${locale} ${theme} public pages reflow across breakpoint edges`, async ({
      page,
    }) => {
      await page.addInitScript(
        (value) => localStorage.setItem("theme", value),
        theme
      )

      for (const width of [
        320, 375, 639, 640, 768, 1023, 1024, 1279, 1280, 1440, 1536,
      ]) {
        await page.setViewportSize({ width, height: 900 })

        for (const route of [`/${locale}`, `/${locale}/demo`]) {
          await page.goto(route)
          await expect(page.locator("main h1")).toBeVisible()
          await expect(page.locator("html")).toHaveClass(new RegExp(theme))
          await page.evaluate(() => document.fonts.ready)

          const layout = await page.evaluate(() => ({
            width: document.documentElement.clientWidth,
            scroll: document.documentElement.scrollWidth,
            clippedHeadings: [
              ...document.querySelectorAll("main h1, main h2, main h3"),
            ]
              .filter(
                (heading) =>
                  heading.clientWidth > 0 &&
                  heading.scrollWidth > heading.clientWidth + 1
              )
              .map((heading) => heading.textContent),
          }))

          expect(layout.scroll, `${route} at ${width}px`).toBeLessThanOrEqual(
            layout.width
          )
          expect(layout.clippedHeadings, `${route} at ${width}px`).toEqual([])
        }
      }
    })
  }
}

test("public pages remain readable with doubled root text size", async ({
  page,
}) => {
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 900 })

    for (const route of ["/fr", "/fr/demo"]) {
      await page.goto(route)
      await expect(page.locator("main h1")).toBeVisible()
      await page.addStyleTag({ content: "html { font-size: 200%; }" })

      const layout = await page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
        overflow: [...document.querySelectorAll("header *, main *, footer *")]
          .filter(
            (element) =>
              element.getBoundingClientRect().right >
                document.documentElement.clientWidth + 1 &&
              element.textContent?.trim()
          )
          .slice(0, 12)
          .map((element) => ({
            tag: element.tagName,
            class: element.className,
            text: element.textContent?.slice(0, 40),
          })),
      }))

      expect(
        layout.scroll,
        `${route} at ${width}px with enlarged text: ${JSON.stringify(layout.overflow)}`
      ).toBeLessThanOrEqual(layout.width)

      if (route.endsWith("/demo")) {
        const titleWidths = await page
          .locator("main [data-slot=card-header] h3")
          .evaluateAll((titles) =>
            titles.map((title) => title.getBoundingClientRect().width)
          )

        for (const titleWidth of titleWidths)
          expect(titleWidth).toBeGreaterThanOrEqual(120)
      }
    }
  }
})

test("mobile menu search and cart actions keep the order available", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto("/en/demo")
  await expect(page.locator("main h1")).toBeVisible()

  const search = page.getByRole("textbox", { name: "Search menu items…" })

  await search.fill("no-such-dish")
  await expect(
    page.getByRole("status").filter({ hasText: /No dishes/ })
  ).toBeVisible()
  await search.fill("truffle")
  await page
    .getByRole("button", { name: "Add The Truffle Double Smash", exact: true })
    .click()
  await expect(page.locator("#demo-cart [role=status]")).toHaveText("4 items")
  await page.getByRole("link", { name: /Your Pickup Order.*4 items/ }).click()
  await page
    .getByRole("button", {
      name: "Increase quantity of The Truffle Double Smash",
    })
    .click()
  await expect(page.locator("#demo-cart [role=status]")).toHaveText("5 items")
  await page
    .getByRole("button", {
      name: "Remove The Truffle Double Smash",
      exact: true,
    })
    .click()
  await expect(page.locator("#demo-cart [role=status]")).toHaveText("2 items")
})

test("desktop menu search has room for its label and query", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto("/en/demo")

  const search = page.getByRole("textbox", { name: "Search menu items…" })

  await expect(search).toBeVisible()
  expect((await search.boundingBox())!.width).toBeGreaterThanOrEqual(320)
})

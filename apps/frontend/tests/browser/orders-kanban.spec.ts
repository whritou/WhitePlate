import { expect, test } from "@playwright/test"
import type { Page } from "@playwright/test"

const orderId = "22222222-2222-4222-8222-222222222222"

async function dragOrder(page: Page, destination: string) {
  const surface = page.locator(
    `[data-order-id="${orderId}"] [data-slot="card-content"]`
  )
  const target = page.locator(`[data-order-lane="${destination}"]`)

  await surface.scrollIntoViewIfNeeded()

  const from = (await surface.boundingBox())!

  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  await target.scrollIntoViewIfNeeded()

  const to = (await target.boundingBox())!

  await page.mouse.move(to.x + to.width / 2, to.y + 80, { steps: 15 })
  await page.mouse.up()
}

async function dragFromActionButton(page: Page, destination: string) {
  const action = page
    .locator(`[data-order-id="${orderId}"] [data-slot="card-footer"] button`)
    .first()
  const target = page.locator(`[data-order-lane="${destination}"]`)

  const from = (await action.boundingBox())!
  const to = (await target.boundingBox())!

  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(to.x + to.width / 2, to.y + 80, { steps: 12 })
  await page.mouse.up()
}

test("next-step buttons persist each stage, terminal orders have no actions", async ({
  page,
}) => {
  await page.goto("/en/orders-kanban-test")
  await expect(page.locator('[data-order-lane="Pending"]')).toContainText("Ada")
  await page
    .getByRole("button", { name: "Start preparing — order 22222222" })
    .click()
  await expect(page.locator('[data-order-lane="Preparing"]')).toContainText(
    "Ada"
  )
  await page
    .getByRole("button", { name: "Mark ready — order 22222222" })
    .click()
  await expect(page.locator('[data-order-lane="Ready"]')).toContainText("Ada")
  await page
    .getByRole("button", { name: "Complete order — order 22222222" })
    .click()
  await expect(page.locator('[data-order-lane="Completed"]')).toContainText(
    "Ada"
  )
  await expect(
    page.locator(`[data-order-id="${orderId}"]`).getByRole("button")
  ).toHaveCount(0)
})

test("dragging rejects skipped stages and kitchen cancellation, and accepts the next stage", async ({
  page,
}) => {
  await page.goto("/en/orders-kanban-test")
  await dragOrder(page, "Ready")
  await expect(page.locator('[data-order-lane="Pending"]')).toContainText("Ada")
  await dragOrder(page, "Cancelled")
  await expect(page.locator('[data-order-lane="Pending"]')).toContainText("Ada")
  await dragOrder(page, "Preparing")
  await expect(page.locator('[data-order-lane="Preparing"]')).toContainText(
    "Ada"
  )
  await expect(page.getByTestId("mutation-count")).toHaveText("1")
})

test("card buttons do not start a drag", async ({ page }) => {
  await page.goto("/en/orders-kanban-test")
  await dragFromActionButton(page, "Preparing")
  await expect(page.getByTestId("mutation-count")).toHaveText("0")
  await expect(page.locator('[data-order-lane="Pending"]')).toContainText("Ada")
})

test("owner can drag to Cancelled; rejected saves leave the ticket in its original lane", async ({
  page,
}) => {
  await page.goto("/en/orders-kanban-test?role=OrganizationOwner")
  await page.getByRole("checkbox", { name: "Reject updates" }).check()
  await dragOrder(page, "Preparing")
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "This order changed before your update was saved" })
  ).toBeVisible()
  await expect(page.locator(`[data-order-id="${orderId}"]`)).toBeVisible()
  await expect(page.locator('[data-order-lane="Pending"]')).toContainText("Ada")
  await page.getByRole("checkbox", { name: "Reject updates" }).uncheck()
  await dragOrder(page, "Cancelled")
  await expect(page.locator('[data-order-lane="Cancelled"]')).toContainText(
    "Ada"
  )
})

test("Escape cancels a drag without submitting an update", async ({ page }) => {
  await page.goto("/en/orders-kanban-test")

  const surface = page.locator(
    `[data-order-id="${orderId}"] [data-slot="card-content"]`
  )
  const from = (await surface.boundingBox())!
  const to = (await page
    .locator('[data-order-lane="Preparing"]')
    .boundingBox())!

  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(to.x + 60, to.y + 80, { steps: 10 })
  await page.keyboard.press("Escape")
  await page.mouse.up()
  await expect(page.getByTestId("mutation-count")).toHaveText("0")
  await expect(page.locator('[data-order-lane="Pending"]')).toContainText("Ada")
})

test("touch dragging moves an order between stacked mobile lanes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 1400 })
  await page.goto("/en/orders-kanban-test")

  const surface = page.locator(
    `[data-order-id="${orderId}"] [data-slot="card-content"]`
  )
  const from = (await surface.boundingBox())!
  const to = (await page
    .locator('[data-order-lane="Preparing"]')
    .boundingBox())!
  const session = await page.context().newCDPSession(page)
  const start = { x: from.x + from.width / 2, y: from.y + from.height / 2 }
  const end = { x: to.x + 60, y: to.y + 80 }

  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [start],
  })
  await page.waitForTimeout(400)
  for (let step = 1; step <= 20; step++) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x: start.x + ((end.x - start.x) * step) / 20,
          y: start.y + ((end.y - start.y) * step) / 20,
        },
      ],
    })
  }

  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  })
  await session.detach()
  await expect(page.locator('[data-order-lane="Preparing"]')).toContainText(
    "Ada"
  )
  await expect(page.getByTestId("mutation-count")).toHaveText("1")
})

test("touch scrolling that begins on a ticket does not move the order", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto("/en/orders-kanban-test")

  const surface = page.locator(
    `[data-order-id="${orderId}"] [data-slot="card-content"]`
  )
  const box = (await surface.boundingBox())!
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  const session = await page.context().newCDPSession(page)

  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [start],
  })
  for (let step = 1; step <= 8; step++) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: start.x, y: start.y - step * 18 }],
    })
  }

  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  })
  await session.detach()

  await expect(page.getByTestId("mutation-count")).toHaveText("0")
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
})

for (const locale of ["en", "fr"]) {
  for (const theme of ["light", "dark"]) {
    test(`${locale}/${theme}: accessible tabs, responsive lanes, pending guards and keyboard alternative`, async ({
      page,
    }) => {
      await page.addInitScript(
        (value) => localStorage.setItem("theme", value),
        theme
      )
      await page.goto(`/${locale}/orders-kanban-test`)

      const tabs = page.getByRole("tablist")

      await expect(tabs.getByRole("tab", { selected: true })).toHaveCount(1)
      await tabs.getByRole("tab").first().focus()
      await page.keyboard.press("ArrowRight")
      await page.keyboard.press("Enter")
      await expect(tabs.getByRole("tab").nth(1)).toHaveAttribute(
        "aria-selected",
        "true"
      )
      await tabs.getByRole("tab").first().click()
      for (const width of [320, 375, 768, 1024, 1440, 1920]) {
        await page.setViewportSize({ width, height: 1000 })
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          )
        ).toBe(true)

        const lanes = await page
          .locator("[data-order-lane]")
          .evaluateAll((elements) =>
            elements.map((element) => element.getBoundingClientRect())
          )
        const firstRow = lanes.filter(
          (lane) => Math.abs(lane.top - lanes[0].top) < 2
        )
        const expectedColumns = width >= 1280 ? 4 : width >= 768 ? 2 : 1

        expect(firstRow).toHaveLength(expectedColumns)
        expect(
          Math.min(...firstRow.map((lane) => lane.width))
        ).toBeGreaterThanOrEqual(Math.min(width - 32, 288))
      }

      const action = page
        .locator(
          `[data-order-id="${orderId}"] [data-slot="card-footer"] button`
        )
        .first()

      expect((await action.boundingBox())!.height).toBeGreaterThanOrEqual(48)
      await action.focus()
      await page.keyboard.press("Enter")
      await expect(
        page.locator(`[data-order-id="${orderId}"] button`).first()
      ).toBeDisabled()
      await expect(page.locator('[data-order-lane="Preparing"]')).toContainText(
        "Ada"
      )
      await expect(page.getByTestId("mutation-count")).toHaveText("1")
      await expect(page.locator(`[data-order-id="${orderId}"]`)).toBeFocused()
    })
  }
}

import { expect, test } from "@playwright/test"

const asset = {
  id: "33333333-3333-4333-8333-333333333333",
  width: 640,
  height: 480,
  bytes: 4000,
}

test("photo actions follow the demo gallery and expose an understandable crop choice", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.route("**/api/product-photos?**", (route) =>
    new URL(route.request().url()).searchParams.has("assetId")
      ? route.fulfill({
          path: "public/design/photo-15.webp",
          contentType: "image/webp",
        })
      : route.fulfill({ json: { storageAvailable: true, assets: [asset] } })
  )
  await page.goto("/en/photo-design-test")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )
  await page
    .getByRole("button", {
      name: "Select Burger Le Rustique Truffé",
      exact: true,
    })
    .click()

  const gallery = page.getByRole("region", { name: "Product photography" })
  const galleryGrid = gallery.getByRole("group", {
    name: "Product photo gallery",
  })
  const tile = galleryGrid.locator("[data-photo-tile]")

  await expect(
    gallery.getByRole("button", { name: "Replace photo", exact: true })
  ).toHaveCount(0)
  await expect(
    gallery.getByRole("button", { name: "Add photos" })
  ).toBeVisible()
  await expect(
    gallery.getByRole("button", { name: "Save photos", exact: true })
  ).toHaveCount(0)
  await expect(
    gallery.getByRole("button", { name: "Discard photo changes", exact: true })
  ).toHaveCount(0)
  await expect(
    gallery.getByRole("button", { name: "Square · 1:1" })
  ).toBeVisible()
  await expect(
    gallery.getByRole("button", { name: "Landscape · 4:3" })
  ).toBeVisible()

  const addPhotos = gallery.getByRole("button", { name: "Add photos" })
  const addPhotosBorder = await addPhotos.evaluate((element) => ({
    color: getComputedStyle(element).borderTopColor,
    style: getComputedStyle(element).borderTopStyle,
  }))

  expect(addPhotosBorder.style).toBe("dashed")
  expect(addPhotosBorder.color).not.toBe("rgba(0, 0, 0, 0)")

  async function expectDemoGalleryLayout() {
    await expect(tile).toHaveCount(1)

    const box = await tile.boundingBox()
    const columns = await galleryGrid.evaluate(
      (element) =>
        getComputedStyle(element).gridTemplateColumns.split(" ").length
    )

    expect(columns).toBe(3)
    expect(box?.width).toBeCloseTo(box?.height ?? 0, 0)
  }

  await expectDemoGalleryLayout()
  await page.setViewportSize({ width: 390, height: 844 })
  await expectDemoGalleryLayout()
})

test("selected products keep archive, cancel and save together in the viewport", async ({
  page,
}) => {
  await page.route("**/api/product-photos?**", (route) =>
    route.fulfill({ json: { storageAvailable: true, assets: [] } })
  )

  for (const [width, height] of [
    [1440, 900],
    [390, 844],
  ] as const) {
    await page.setViewportSize({ width, height })
    await page.goto("/en/photo-design-test")
    await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
      "data-ready",
      "true"
    )
    await page
      .getByRole("button", {
        name: "Select Burger Le Rustique Truffé",
        exact: true,
      })
      .click()

    const panel = page.locator(".live-product-panel").filter({ visible: true })
    const form = panel.getByRole("form", {
      name: "Edit product Burger Le Rustique Truffé",
    })
    const archive = panel.getByRole("button", {
      name: "Archive Burger Le Rustique Truffé",
      exact: true,
    })
    const cancel = form.getByRole("button", { name: "Cancel", exact: true })
    const save = form.getByRole("button", {
      name: "Save changes",
      exact: true,
    })

    await expect(archive).toBeInViewport()
    await expect(cancel).toBeInViewport()
    await expect(save).toBeInViewport()

    const actionPositions = await Promise.all(
      [archive, cancel, save].map(async (button) => button.boundingBox())
    )
    const topPositions = actionPositions.map((box) => box?.y ?? 0)

    expect(Math.max(...topPositions) - Math.min(...topPositions)).toBeLessThan(
      3
    )

    const saveBox = await save.boundingBox()

    expect((saveBox?.x ?? 0) + (saveBox?.width ?? 0)).toBeGreaterThan(
      width * 0.9
    )
  }
})

test("one save and cancel control applies to photo and product drafts", async ({
  page,
}) => {
  let savedPhotos = [asset]
  const photosById = new Map([
    [asset.id, asset],
    [
      "44444444-4444-4444-8444-444444444444",
      { ...asset, id: "44444444-4444-4444-8444-444444444444" },
    ],
  ])
  const writes: string[] = []

  await page.route("**/api/product-photos?**", async (route) => {
    const request = route.request()
    const url = new URL(request.url())

    if (url.searchParams.has("assetId"))
      return route.fulfill({
        path: "public/design/photo-15.webp",
        contentType: "image/webp",
      })

    if (request.method() === "POST")
      return route.fulfill({
        status: 201,
        json: { ...asset, id: "44444444-4444-4444-8444-444444444444" },
      })

    if (request.method() === "PUT") {
      const { assetIds } = request.postDataJSON() as { assetIds: string[] }

      savedPhotos = assetIds.flatMap((id) => {
        const photo = photosById.get(id)

        return photo ? [photo] : []
      })
      writes.push("photos")
    }

    return route.fulfill({
      json: { storageAvailable: true, assets: savedPhotos },
    })
  })

  await page.route("**/photo-design-test*", async (route) => {
    if (route.request().method() !== "POST") return route.continue()

    writes.push("product")

    return route.fulfill({
      status: 200,
      contentType: "text/x-component",
      body: '0:{"a":{"ok":true},"f":"","b":""}\n',
    })
  })

  await page.goto("/en/photo-design-test")
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )
  await page
    .getByRole("button", {
      name: "Select Burger Le Rustique Truffé",
      exact: true,
    })
    .click()

  const form = page.getByRole("form", {
    name: "Edit product Burger Le Rustique Truffé",
  })
  const gallery = page.getByRole("region", { name: "Product photography" })

  await form.getByLabel("Name", { exact: true }).fill("Updated burger")
  await gallery.getByRole("button", { name: "Add photos", exact: true }).click()
  await page.getByLabel("Choose product photos").setInputFiles({
    name: "burger.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from([255, 216, 255]),
  })
  await expect(page.getByText("Unsaved product changes")).toBeVisible()
  await form.getByRole("button", { name: "Save changes", exact: true }).click()
  await expect.poll(() => writes).toEqual(["photos", "product"])

  await page.reload()
  await expect(page.getByTestId("fixture-ready")).toHaveAttribute(
    "data-ready",
    "true"
  )
  await page
    .getByRole("button", {
      name: "Select Burger Le Rustique Truffé",
      exact: true,
    })
    .click()

  const reopenedForm = page.getByRole("form", {
    name: "Edit product Burger Le Rustique Truffé",
  })
  const reopenedGallery = page.getByRole("region", {
    name: "Product photography",
  })

  await expect(
    reopenedGallery.getByRole("button", { name: "Show photo 2", exact: true })
  ).toBeVisible()
  await reopenedForm
    .getByLabel("Name", { exact: true })
    .fill("Discarded burger")
  await reopenedGallery.locator("[data-photo-tile]").nth(1).hover()
  await reopenedGallery
    .getByRole("button", { name: "Remove photo 2", exact: true })
    .click()
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Remove", exact: true })
    .click()
  await reopenedForm
    .getByRole("button", { name: "Cancel", exact: true })
    .click()

  await expect(reopenedForm.getByLabel("Name", { exact: true })).toHaveValue(
    "Burger Le Rustique Truffé"
  )
  await expect(
    reopenedGallery.getByRole("button", { name: "Show photo 2", exact: true })
  ).toBeVisible()
  await expect(page.getByText("Unsaved product changes")).not.toBeVisible()
})

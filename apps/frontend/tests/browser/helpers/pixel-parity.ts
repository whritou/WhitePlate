import { expect, type Page } from "@playwright/test"
import { mkdir, writeFile } from "node:fs/promises"
import { dirname } from "node:path"
import sharp from "sharp"

export const parityCaptureOptions = {
  animations: "disabled" as const,
  style: "nextjs-portal { visibility: hidden !important; }",
}

export async function captureParityRegion(
  page: Page,
  selector: string,
  path: string
) {
  await mkdir(dirname(path), { recursive: true })
  // Both neutral captures must start with the same pointer/hover state.
  await page.mouse.move(0, 0)

  const element = page.locator(selector)

  await element.scrollIntoViewIfNeeded()

  const bounds = await element.boundingBox()
  const viewport = await page.screenshot({
    ...parityCaptureOptions,
    path: path.replace(/\.png$/, "-viewport.png"),
  })
  const size = page.viewportSize()
  const contained =
    bounds &&
    size &&
    bounds.x >= 0 &&
    bounds.y >= 0 &&
    bounds.x + bounds.width <= size.width &&
    bounds.y + bounds.height <= size.height
  // Crop the same captured frame; a second browser paint can round edge colors differently.
  const bytes = contained
    ? await sharp(viewport)
        .extract({
          left: Math.floor(bounds.x),
          top: Math.floor(bounds.y),
          width: Math.ceil(bounds.x + bounds.width) - Math.floor(bounds.x),
          height: Math.ceil(bounds.y + bounds.height) - Math.floor(bounds.y),
        })
        .png()
        .toBuffer()
    : await element.screenshot(parityCaptureOptions)

  await writeFile(path, bytes)

  return { bytes, viewport, bounds }
}

export async function expectSamePixels(
  studio: Buffer,
  live: Buffer,
  reportPath: string,
  label: string
) {
  const source = await sharp(studio).raw().toBuffer({ resolveWithObject: true })
  const actual = await sharp(live).raw().toBuffer({ resolveWithObject: true })

  expect(actual.info).toEqual(source.info)

  let maximumChannelDifference = 0
  let changedChannels = 0

  for (let i = 0; i < source.data.length; i++) {
    const difference = Math.abs(source.data[i] - actual.data[i])

    if (difference) changedChannels++
    maximumChannelDifference = Math.max(maximumChannelDifference, difference)
  }

  await writeFile(
    reportPath,
    JSON.stringify({ maximumChannelDifference, changedChannels })
  )
  // Exact product pixels are required; development tooling is excluded above.
  expect.soft(maximumChannelDifference, label).toBe(0)
}

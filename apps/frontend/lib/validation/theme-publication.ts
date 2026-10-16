import { isRecord, isUuid } from "./common"
import { parseThemeAppearance } from "./theme-appearance"
import type { PublishedTheme, ThemePublication } from "@/types/theme"

const version = (value: unknown) =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 1 &&
  value <= 2147483647
const nullableId = (value: unknown) => value === null || isUuid(value)
const nullableDate = (value: unknown) =>
  value === null ||
  (typeof value === "string" && Number.isFinite(Date.parse(value)))

export function parseThemePublication(input: unknown): ThemePublication | null {
  if (
    !isRecord(input) ||
    !version(input.sourceDraftVersion) ||
    !version(input.version) ||
    !nullableId(input.logoAssetId) ||
    !nullableId(input.faviconAssetId) ||
    !nullableId(input.bannerAssetId) ||
    !nullableDate(input.publishedAt)
  )
    return null

  const theme = parseThemeAppearance(input.theme)

  return theme
    ? {
        theme,
        logoAssetId: input.logoAssetId as string | null,
        faviconAssetId: input.faviconAssetId as string | null,
        bannerAssetId: input.bannerAssetId as string | null,
        sourceDraftVersion: input.sourceDraftVersion as number,
        publishedAt: input.publishedAt as string | null,
        version: input.version as number,
      }
    : null
}

export function parsePublishedTheme(input: unknown): PublishedTheme | null {
  if (
    !isRecord(input) ||
    typeof input.hasLogo !== "boolean" ||
    typeof input.hasFavicon !== "boolean" ||
    typeof input.hasBanner !== "boolean" ||
    !version(input.version) ||
    !nullableDate(input.publishedAt)
  )
    return null

  const theme = parseThemeAppearance(input.theme)

  return theme
    ? {
        theme,
        hasLogo: input.hasLogo,
        hasFavicon: input.hasFavicon,
        hasBanner: input.hasBanner,
        publishedAt: input.publishedAt as string | null,
        version: input.version as number,
      }
    : null
}

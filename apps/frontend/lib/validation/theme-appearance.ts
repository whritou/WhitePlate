import { FONTS } from "@/lib/lovable/storeTheme"
import { isRecord } from "./common"
import type { StoreTheme } from "@/types/lovable/storeTheme"
import type {
  ThemeAppearance,
  ThemeDraft,
  ThemePalette,
  ThemePaletteResult,
} from "@/types/theme"

const color = (value: unknown) =>
  typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)
const oneOf =
  (...values: unknown[]) =>
  (value: unknown) =>
    values.includes(value)
const range =
  (min: number, max: number, integer = false) =>
  (value: unknown) =>
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max &&
    (!integer || Number.isInteger(value))
const schema = {
  primary: color,
  accent: color,
  bg: color,
  text: color,
  font: oneOf(...FONTS, "Inter"),
  headingFont: oneOf(...FONTS, "Inter"),
  headingWeight: oneOf(400, 500, 600, 700),
  bodyWeight: oneOf(400, 500),
  textScale: range(0.9, 1.2),
  lineHeight: range(1.3, 1.8),
  buttonRadius: range(0, 28, true),
  radius: range(0, 24, true),
  buttonStyle: oneOf("solid", "outline"),
  spacing: oneOf("compact", "comfortable", "airy"),
  imageRatio: oneOf("square", "landscape", "wide"),
  bannerHeight: range(180, 440, true),
  bannerAlign: oneOf("left", "center"),
  bannerOverlay: range(20, 85, true),
  showRestaurantInfo: oneOf(true, false),
  showBanner: oneOf(true, false),
  layout: oneOf("grid", "list"),
  ambiance: oneOf("custom", "crisp-light", "warm-cream", "bistro-noir"),
}

export function parseThemeAppearance(input: unknown): ThemeAppearance | null {
  if (!isRecord(input) || Object.keys(input).some((key) => !(key in schema)))
    return null
  if (!Object.entries(schema).every(([key, validate]) => validate(input[key])))
    return null

  return Object.fromEntries(
    Object.keys(schema).map((key) => [key, input[key]])
  ) as ThemeAppearance
}

export function themeAppearance(input: StoreTheme): ThemeAppearance {
  return Object.fromEntries(
    Object.keys(schema).map((key) => [
      key,
      key === "ambiance"
        ? (input.ambiance ?? "custom")
        : input[key as keyof StoreTheme],
    ])
  ) as ThemeAppearance
}

export function parseThemeDraft(input: unknown): ThemeDraft | null {
  if (!isRecord(input) || !range(1, 2147483647, true)(input.version))
    return null

  const theme = parseThemeAppearance(input.theme)

  return theme ? { theme, version: input.version as number } : null
}

export function parseThemePalette(input: unknown): ThemePaletteResult | null {
  if (!isRecord(input)) return null
  if (
    input.palette === null &&
    ["no_logo", "unavailable", "unusable"].includes(String(input.reason))
  )
    return {
      palette: null,
      reason: input.reason as ThemePaletteResult["reason"],
    }

  const palette = input.palette

  if (
    !isRecord(palette) ||
    !["primary", "accent", "bg", "text"].every((key) => color(palette[key]))
  )
    return null

  const { primary, accent, bg, text } = palette

  return {
    palette: { primary, accent, bg, text } as ThemePalette,
    reason: null,
  }
}

function luminance(hex: string) {
  const channels = [1, 3, 5].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255

    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

export function themeContrast(theme: ThemePalette) {
  const ratio = (a: string, b: string) => {
    const first = luminance(a),
      second = luminance(b)

    return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
  }

  const textOnBackground = ratio(theme.text, theme.bg)
  const primaryOnBackground = ratio(theme.primary, theme.bg)
  const textOnAccent = ratio(theme.text, theme.accent)

  return {
    textOnBackground,
    primaryOnBackground,
    textOnAccent,
    readyForPublication:
      textOnBackground >= 4.5 &&
      primaryOnBackground >= 4.5 &&
      textOnAccent >= 4.5,
  }
}

import type { StoreTheme } from "./lovable/storeTheme"
import type { BrandAssetsProps } from "./brand-assets"

export type ThemeAmbiance =
  "custom" | "crisp-light" | "warm-cream" | "bistro-noir"
export type ThemeAppearance = Pick<
  StoreTheme,
  | "primary"
  | "accent"
  | "bg"
  | "text"
  | "font"
  | "headingFont"
  | "headingWeight"
  | "bodyWeight"
  | "textScale"
  | "lineHeight"
  | "buttonRadius"
  | "buttonStyle"
  | "spacing"
  | "imageRatio"
  | "bannerHeight"
  | "bannerAlign"
  | "bannerOverlay"
  | "showRestaurantInfo"
  | "radius"
  | "layout"
  | "showBanner"
> & { ambiance: ThemeAmbiance }
export type ThemeDraft = { theme: ThemeAppearance; version: number }
export type ThemePalette = Pick<
  ThemeAppearance,
  "primary" | "accent" | "bg" | "text"
>
export type ThemePaletteResult = {
  palette: ThemePalette | null
  reason: "no_logo" | "unavailable" | "unusable" | null
}
export type LiveStudioProps = BrandAssetsProps & { initialTheme?: ThemeDraft }
export type StudioController = {
  theme: StoreTheme
  set: (patch: Partial<StoreTheme>) => void
  publish: () => void
  saved: boolean
  locked: boolean
  saving: boolean
  notice: string
  logoPreset?: ThemePalette
  canReload: boolean
}

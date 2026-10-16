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
export type ThemePublication = {
  theme: ThemeAppearance
  logoAssetId: string | null
  faviconAssetId: string | null
  bannerAssetId: string | null
  sourceDraftVersion: number
  publishedAt: string | null
  version: number
}
export type PublishedTheme = {
  theme: ThemeAppearance
  hasLogo: boolean
  hasFavicon: boolean
  hasBanner: boolean
  publishedAt: string | null
  version: number
}
export type ThemePalette = Pick<
  ThemeAppearance,
  "primary" | "accent" | "bg" | "text"
>
export type ThemePaletteResult = {
  palette: ThemePalette | null
  reason: "no_logo" | "unavailable" | "unusable" | null
}
export type LiveStudioProps = BrandAssetsProps & {
  initialTheme?: ThemeDraft
  initialPublication?: ThemePublication
}
export type StudioPanel = "design" | "brand"
export type StudioController = {
  theme: StoreTheme
  set: (patch: Partial<StoreTheme>) => void
  saveDraft: () => void
  publish: () => void
  discard: () => void
  saved: boolean
  locked: boolean
  saving: boolean
  publishing: boolean
  canPublish: boolean
  notice: string
  logoPreset?: ThemePalette
  canReload: boolean
}
export type StudioNavigation = {
  panel: StudioPanel
  setPanel: (panel: StudioPanel) => void
}

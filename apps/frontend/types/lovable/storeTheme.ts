export type StoreTheme = {
  name: string
  tagline: string
  primary: string
  accent: string
  bg: string
  text: string
  font: string
  headingFont: string
  headingWeight: number
  bodyWeight: number
  textScale: number
  lineHeight: number
  buttonRadius: number
  buttonStyle: "solid" | "outline"
  spacing: "compact" | "comfortable" | "airy"
  imageRatio: "square" | "landscape" | "wide"
  bannerHeight: number
  bannerAlign: "left" | "center"
  bannerOverlay: number
  showRestaurantInfo: boolean
  radius: number
  layout: "grid" | "list"
  showBanner: boolean
  logo: string
  banner: string
  favicon: string
  domain: string
  domainStatus: "none" | "pending" | "connected"
  address: string
  phone: string
  hours: string
  prepTime: string
}

import type { StoreTheme } from "@/types/lovable/storeTheme"
import type { CSSProperties } from "react"
export type { StoreTheme } from "@/types/lovable/storeTheme"

const logo = "/lovable/store/logo.png"
const banner = "/lovable/store/banner.jpg"

export const DEFAULT_THEME: StoreTheme = {
  name: "Maison Verte",
  tagline: "Seasonal kitchen · Click & collect in 15 min",
  primary: "#1f7a4d",
  accent: "#c8f04a",
  bg: "#f7f8f4",
  text: "#14201a",
  font: "Space Grotesk",
  headingFont: "Space Grotesk",
  headingWeight: 700,
  bodyWeight: 400,
  textScale: 1,
  lineHeight: 1.5,
  buttonRadius: 12,
  buttonStyle: "solid",
  spacing: "comfortable",
  imageRatio: "landscape",
  bannerHeight: 300,
  bannerAlign: "left",
  bannerOverlay: 65,
  showRestaurantInfo: true,
  radius: 12,
  layout: "grid",
  showBanner: true,
  logo,
  banner,
  favicon: "/lovable/store-favicon.png",
  domain: "",
  domainStatus: "none",
  address: "12 rue de la Roquette, 75011 Paris",
  phone: "+33 1 23 45 67 89",
  hours: "Mon–Sat · 11:30–14:30, 18:30–22:30",
  prepTime: "15 min",
}
export const PRESETS: { label: string; theme: Partial<StoreTheme> }[] = [
  {
    label: "Verte",
    theme: {
      primary: "#1f7a4d",
      accent: "#c8f04a",
      bg: "#f7f8f4",
      text: "#14201a",
      font: "Space Grotesk",
    },
  },
  {
    label: "Trattoria",
    theme: {
      primary: "#b3261e",
      accent: "#f4d35e",
      bg: "#fff8ef",
      text: "#2a1a12",
      font: "Fraunces",
    },
  },
  {
    label: "Sushi Noir",
    theme: {
      primary: "#e8e2d4",
      accent: "#e4572e",
      bg: "#111111",
      text: "#f3efe6",
      font: "DM Sans",
    },
  },
  {
    label: "Burger Pop",
    theme: {
      primary: "#ff5a1f",
      accent: "#ffd23f",
      bg: "#fffdf7",
      text: "#1b1b1b",
      font: "Archivo Black",
      radius: 0,
    },
  },
]
export const FONTS = [
  "Space Grotesk",
  "DM Sans",
  "Outfit",
  "Manrope",
  "Plus Jakarta Sans",
  "Sora",
  "Work Sans",
  "Nunito Sans",
  "Lora",
  "Fraunces",
  "Playfair Display",
  "Archivo Black",
]
export const FONT_PAIRS = [
  { label: "Modern", headingFont: "Space Grotesk", font: "DM Sans" },
  { label: "Friendly", headingFont: "Outfit", font: "Nunito Sans" },
  { label: "Editorial", headingFont: "Fraunces", font: "Work Sans" },
  { label: "Refined", headingFont: "Playfair Display", font: "Manrope" },
]
export const FONT_LINK =
  "https://fonts.googleapis.com/css2?" +
  FONTS.map(
    (f) =>
      `family=${f.replace(/ /g, "+")}${f === "Archivo Black" ? "" : ":wght@400;500;600;700"}`
  ).join("&") +
  "&display=swap"

const KEY = "whiteplate-lovable-demo-store-theme"

export function loadTheme(storageKey = KEY): StoreTheme {
  try {
    const raw = localStorage.getItem(storageKey)

    if (!raw) return DEFAULT_THEME

    const saved = JSON.parse(raw)

    return {
      ...DEFAULT_THEME,
      ...saved,
      headingFont: saved.headingFont ?? saved.font ?? DEFAULT_THEME.headingFont,
      buttonRadius:
        saved.buttonRadius ?? saved.radius ?? DEFAULT_THEME.buttonRadius,
    }
  } catch {
    return DEFAULT_THEME
  }
}

export function saveTheme(t: StoreTheme, storageKey = KEY) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(t))

    return true
  } catch {
    return false // uploaded images too large for browser storage
  }
}

export function setFavicon(href: string) {
  let el = document.querySelector<HTMLLinkElement>("link[rel='icon']")

  if (!el) {
    el = document.createElement("link")
    el.rel = "icon"
    document.head.appendChild(el)
  }

  el.href = href
}

export function themeVariables(t: StoreTheme): CSSProperties {
  return {
    "--background": t.bg,
    "--foreground": t.text,
    "--primary": t.primary,
    "--primary-foreground": t.bg,
    "--accent": t.accent,
    "--accent-foreground": t.text,
    "--secondary":
      "color-mix(in oklab, var(--foreground) 5%, var(--background))",
    "--secondary-foreground": t.text,
    "--muted": "var(--secondary)",
    "--muted-foreground":
      "color-mix(in oklab, var(--foreground) 68%, var(--background))",
    "--border": "color-mix(in oklab, var(--foreground) 15%, var(--background))",
    "--input": "var(--border)",
    "--ring": t.primary,
    "--customer-radius": `${t.radius}px`,
    "--customer-button-radius": `${t.buttonRadius}px`,
    "--customer-font": `"${t.font}", system-ui, sans-serif`,
    "--customer-heading-font": `"${t.headingFont}", system-ui, sans-serif`,
    "--customer-heading-weight": t.headingWeight,
    "--customer-body-weight": t.bodyWeight,
    "--customer-text-scale": t.textScale,
    "--customer-line-height": t.lineHeight,
    "--customer-gap":
      t.spacing === "compact" ? "10px" : t.spacing === "airy" ? "24px" : "16px",
    "--customer-padding":
      t.spacing === "compact" ? "12px" : t.spacing === "airy" ? "24px" : "16px",
    "--customer-image-ratio":
      t.imageRatio === "square"
        ? "1"
        : t.imageRatio === "wide"
          ? "16 / 9"
          : "4 / 3",
    "--customer-banner-height": `${t.bannerHeight}px`,
    "--customer-banner-overlay": t.bannerOverlay / 100,
  } as CSSProperties
}

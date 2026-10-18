import type { PublicEstablishment } from "@/types/establishment-settings"
import type { SearchParams } from "@/types/navigation"
import type { Product } from "@/types/storefront"
import { publishedStoreTheme } from "@/lib/lovable/storeTheme"

export const establishment: PublicEstablishment = {
  name: "Maison Verte",
  phone: "+33123456789",
  addressLine1: "12 rue de la Roquette",
  addressLine2: null,
  postalCode: "75011",
  city: "Paris",
  region: null,
  countryCode: "FR",
  latitude: null,
  longitude: null,
  timeZone: "Europe/Paris",
  pickupInstruction: "Entrez par la porte verte.",
  pickupLocale: "fr",
  openingHours: {
    days: Array.from({ length: 7 }, (_, index) => ({
      dayOfWeek: index + 1,
      isClosed: index === 6,
      windows: index === 6 ? [] : [{ start: "11:30", end: "14:30" }],
    })),
  },
}

export const STORE_THEME_PARITY_FIXTURE = {
  ...publishedStoreTheme("Maison Verte", null, "maison-verte"),
  bg: "#fffdf7",
  text: "#1b1b1b",
  primary: "#b3261e",
  accent: "#ffd23f",
  font: "DM Sans",
  headingFont: "Fraunces",
  headingWeight: 600,
  bodyWeight: 400,
  textScale: 1.1,
  lineHeight: 1.6,
  buttonStyle: "outline" as const,
  spacing: "airy" as const,
  imageRatio: "wide" as const,
  bannerOverlay: 42,
  radius: 14,
  buttonRadius: 8,
  layout: "grid" as const,
}

export function storeThemeFixture(query: SearchParams) {
  const layout = Array.isArray(query.layout) ? query.layout[0] : query.layout
  const custom = Array.isArray(query.theme) ? query.theme[0] : query.theme

  if (custom === "parity") return STORE_THEME_PARITY_FIXTURE

  return {
    ...publishedStoreTheme("Maison Verte", null, "maison-verte"),
    ...(layout === "list" ? { layout: "list" as const } : {}),
    ...(custom === "custom"
      ? {
          primary: "#b3261e",
          buttonStyle: "outline" as const,
          layout: "list" as const,
          imageRatio: "square" as const,
        }
      : {}),
  }
}

export function storeProductFixture(query: SearchParams): Product {
  const long =
    query.long === "1" || (Array.isArray(query.long) && query.long[0] === "1")
  const hasPhotos =
    query.photos === "1" ||
    (Array.isArray(query.photos) && query.photos[0] === "1")
  const unavailableChoices =
    query.choices === "empty" ||
    (Array.isArray(query.choices) && query.choices.includes("empty"))

  return {
    id: "33333333-3333-4333-8333-333333333333",
    name: long
      ? "BurrataSuperLongProductName".repeat(6)
      : "Burrata & tomates anciennes",
    description: long
      ? "SeasonalIngredientsAndDescription".repeat(20)
      : "Basilic et tomates",
    basePrice: 11,
    isAvailable: true,
    photos: hasPhotos
      ? [{ id: "fixture-photo", width: 1600, height: 900, bytes: 1024 }]
      : [],
    optionGroups: [
      {
        id: "side-group",
        name: "Accompagnement",
        minimumSelections: 1,
        maximumSelections: 1,
        options: unavailableChoices
          ? []
          : [
              {
                id: "side-potatoes",
                name: "Pommes de terre rôties",
                priceAdjustment: 0.5,
              },
            ],
      },
    ],
  }
}

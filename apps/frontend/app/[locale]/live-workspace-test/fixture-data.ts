import type { PublicEstablishment } from "@/types/establishment-settings"
import type { SearchParams } from "@/types/navigation"
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

export function storeThemeFixture(query: SearchParams) {
  const layout = Array.isArray(query.layout) ? query.layout[0] : query.layout
  const custom = Array.isArray(query.theme) ? query.theme[0] : query.theme

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

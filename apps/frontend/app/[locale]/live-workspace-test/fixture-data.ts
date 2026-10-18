import type { PublicEstablishment } from "@/types/establishment-settings"

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

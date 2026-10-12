import type { PublicEstablishment } from "@/types/establishment-settings"

export function establishmentLinks(value: PublicEstablishment) {
  const coordinates =
    value.latitude !== null &&
    value.longitude !== null &&
    Number.isFinite(value.latitude) &&
    Number.isFinite(value.longitude) &&
    Math.abs(value.latitude) <= 90 &&
    Math.abs(value.longitude) <= 180
      ? `${value.latitude},${value.longitude}`
      : null
  const address =
    value.addressLine1 && value.city && value.countryCode
      ? [
          value.name,
          value.addressLine1,
          value.addressLine2,
          value.postalCode,
          value.city,
          value.region,
          value.countryCode,
        ]
          .filter(Boolean)
          .join(", ")
      : null
  const destination = coordinates ?? address
  const google = destination
    ? `https://www.google.com/maps/dir/?${new URLSearchParams({ api: "1", destination })}`
    : null
  const waze = coordinates
    ? `https://www.waze.com/ul?${new URLSearchParams({ ll: coordinates, navigate: "yes" })}`
    : null
  const phone =
    value.phone && /^[+\d ().-]+$/.test(value.phone) && /\d/.test(value.phone)
      ? `tel:${value.phone.replace(/[^+\d]/g, "")}`
      : null

  return { google, waze, phone }
}

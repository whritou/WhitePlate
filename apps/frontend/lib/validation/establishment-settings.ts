import { isRecord, isUuid } from "./common"
import type {
  EstablishmentInput,
  EstablishmentOptions,
  EstablishmentSettings,
  PublicEstablishment,
} from "@/types/establishment-settings"

const limits = {
  phone: 40,
  addressLine1: 200,
  addressLine2: 200,
  postalCode: 20,
  city: 100,
  region: 100,
  countryCode: 2,
} as const

function scalarFields(value: Record<string, unknown>) {
  if (
    typeof value.name !== "string" ||
    !value.name.trim() ||
    value.name.length > 200 ||
    typeof value.timeZone !== "string" ||
    !value.timeZone ||
    value.timeZone.length > 100
  )
    return false
  if (
    !Object.entries(limits).every(
      ([key, limit]) =>
        value[key] === null ||
        (typeof value[key] === "string" && value[key].length <= limit)
    )
  )
    return false
  if (
    value.countryCode !== null &&
    !/^[A-Z]{2}$/.test(String(value.countryCode))
  )
    return false

  return (
    [value.latitude, value.longitude].every(
      (coordinate) =>
        coordinate === null ||
        (typeof coordinate === "number" && Number.isFinite(coordinate))
    ) &&
    (value.latitude === null) === (value.longitude === null) &&
    (value.latitude === null || Math.abs(Number(value.latitude)) <= 90) &&
    (value.longitude === null || Math.abs(Number(value.longitude)) <= 180)
  )
}

function scalarProjection(value: Record<string, unknown>) {
  return {
    name: value.name,
    ...Object.fromEntries(Object.keys(limits).map((key) => [key, value[key]])),
    latitude: value.latitude,
    longitude: value.longitude,
    timeZone: value.timeZone,
  }
}

export function parsePublicEstablishment(
  value: unknown
): PublicEstablishment | null {
  if (
    !isRecord(value) ||
    !scalarFields(value) ||
    !(
      value.pickupInstruction === null ||
      (typeof value.pickupInstruction === "string" &&
        value.pickupInstruction.length <= 1000)
    ) ||
    !(
      value.pickupLocale === null ||
      (typeof value.pickupLocale === "string" &&
        value.pickupLocale.length <= 128)
    )
  )
    return null
  try {
    new Intl.DateTimeFormat("en", { timeZone: value.timeZone as string })
  } catch {
    return null
  }

  return {
    ...scalarProjection(value),
    pickupInstruction: value.pickupInstruction,
    pickupLocale: value.pickupLocale,
  } as PublicEstablishment
}

export function parseEstablishmentSettings(
  value: unknown
): EstablishmentSettings | null {
  if (
    !isRecord(value) ||
    !scalarFields(value) ||
    !Number.isSafeInteger(value.establishmentVersion) ||
    Number(value.establishmentVersion) < 1 ||
    !Array.isArray(value.locales) ||
    !value.locales.length ||
    !value.locales.every(
      (locale) =>
        typeof locale === "string" && locale.length > 0 && locale.length <= 128
    ) ||
    !value.locales.includes(value.defaultLocale) ||
    !isRecord(value.pickupInstructions) ||
    !Object.entries(value.pickupInstructions).every(
      ([locale, text]) =>
        value.locales instanceof Array &&
        value.locales.includes(locale) &&
        typeof text === "string" &&
        text.length <= 1000
    )
  )
    return null

  return {
    ...scalarProjection(value),
    establishmentVersion: value.establishmentVersion,
    locales: [...value.locales],
    defaultLocale: value.defaultLocale,
    pickupInstructions: { ...value.pickupInstructions },
  } as EstablishmentSettings
}

export function parseEstablishmentOptions(
  value: unknown
): EstablishmentOptions | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.timeZones) ||
    !value.timeZones.includes("UTC") ||
    !value.timeZones.every(
      (zone) =>
        typeof zone === "string" && zone.length > 0 && zone.length <= 100
    ) ||
    !Array.isArray(value.countries) ||
    !value.countries.every(
      (code) => typeof code === "string" && /^[A-Z]{2}$/.test(code)
    )
  )
    return null

  return { timeZones: [...value.timeZones], countries: [...value.countries] }
}

export function parseEstablishmentInput(
  value: unknown
): EstablishmentInput | null {
  if (
    !isRecord(value) ||
    !isUuid(value.tenantId) ||
    !isRecord(value.pickupInstructions)
  )
    return null

  const locales = Object.keys(value.pickupInstructions)
  const parsed = parseEstablishmentSettings({
    ...value,
    locales: locales.length ? locales : ["en"],
    defaultLocale: locales[0] ?? "en",
  })

  if (!parsed) return null

  return {
    ...scalarProjection(parsed),
    pickupInstructions: parsed.pickupInstructions,
    establishmentVersion: parsed.establishmentVersion,
    tenantId: value.tenantId,
  } as EstablishmentInput
}

import { isRecord, isUuid } from "./common"
import type {
  EstablishmentInput,
  EstablishmentOptions,
  EstablishmentSettings,
  PublicEstablishment,
  OpeningHoursSchedule,
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

export function parseOpeningHours(
  value: unknown
): OpeningHoursSchedule | null | undefined {
  if (value === undefined) return null
  if (value === null) return null
  if (!isRecord(value) || !Array.isArray(value.days) || value.days.length !== 7)
    return undefined

  const days = value.days.map((day, index) => {
    if (
      !isRecord(day) ||
      day.dayOfWeek !== index + 1 ||
      typeof day.isClosed !== "boolean" ||
      !Array.isArray(day.windows) ||
      day.windows.length > 8 ||
      (day.isClosed && day.windows.length !== 0) ||
      (!day.isClosed && day.windows.length === 0)
    )
      return null

    let priorEnd = -1
    const windows = day.windows.map((window) => {
      if (
        !isRecord(window) ||
        typeof window.start !== "string" ||
        typeof window.end !== "string" ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(window.start) ||
        !/^([01]\d|2[0-3]):[0-5]\d$|^24:00$/.test(window.end)
      )
        return null

      const start =
        Number(window.start.slice(0, 2)) * 60 + Number(window.start.slice(3))
      const end =
        window.end === "24:00"
          ? 1440
          : Number(window.end.slice(0, 2)) * 60 + Number(window.end.slice(3))

      if (start >= end || start < priorEnd) return null
      priorEnd = end

      return { start: window.start, end: window.end }
    })

    return windows.some((window) => window === null)
      ? null
      : {
          dayOfWeek: day.dayOfWeek as number,
          isClosed: day.isClosed,
          windows: windows as { start: string; end: string }[],
        }
  })

  return days.some((day) => day === null)
    ? undefined
    : { days: days as NonNullable<OpeningHoursSchedule["days"]> }
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
    ) ||
    parseOpeningHours(value.openingHours) === undefined
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
    openingHours: parseOpeningHours(value.openingHours) ?? null,
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
    parseOpeningHours(value.openingHours) === undefined ||
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
    openingHours: parseOpeningHours(value.openingHours) ?? null,
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

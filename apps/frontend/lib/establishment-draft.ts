import type {
  EstablishmentDraft,
  EstablishmentInput,
  EstablishmentOptions,
  EstablishmentSettings,
} from "@/types/establishment-settings"

export function establishmentDraft(
  settings: EstablishmentSettings
): EstablishmentDraft {
  return {
    name: settings.name,
    phone: settings.phone ?? "",
    addressLine1: settings.addressLine1 ?? "",
    addressLine2: settings.addressLine2 ?? "",
    postalCode: settings.postalCode ?? "",
    city: settings.city ?? "",
    region: settings.region ?? "",
    countryCode: settings.countryCode ?? "",
    latitude: settings.latitude === null ? "" : String(settings.latitude),
    longitude: settings.longitude === null ? "" : String(settings.longitude),
    timeZone: settings.timeZone,
    pickupInstructions: Object.fromEntries(
      settings.locales.map((locale) => [
        locale,
        settings.pickupInstructions[locale] ?? "",
      ])
    ),
  }
}

export function establishmentDraftErrors(
  draft: EstablishmentDraft,
  options: EstablishmentOptions
) {
  const errors: Record<string, boolean> = {}
  const optional = {
    phone: 40,
    addressLine1: 200,
    addressLine2: 200,
    postalCode: 20,
    city: 100,
    region: 100,
  } as const

  for (const [key, limit] of Object.entries(optional))
    errors[key] = draft[key as keyof typeof optional].trim().length > limit
  errors.name = !draft.name.trim() || draft.name.trim().length > 200
  errors.timeZone = !options.timeZones.includes(draft.timeZone)
  errors.countryCode =
    !!draft.countryCode && !options.countries.includes(draft.countryCode)
  if (draft.phone.trim())
    errors.phone =
      errors.phone ||
      !/^[+\d ().-]+$/.test(draft.phone.trim()) ||
      (draft.phone.match(/\d/g)?.length ?? 0) < 3 ||
      (draft.phone.match(/\d/g)?.length ?? 0) > 20

  const address = [
    draft.addressLine1,
    draft.addressLine2,
    draft.postalCode,
    draft.city,
    draft.region,
    draft.countryCode,
  ].some((value) => !!value.trim())

  if (address)
    for (const key of ["addressLine1", "city", "countryCode"] as const)
      errors[key] = errors[key] || !draft[key].trim()
  for (const [key, bound] of [
    ["latitude", 90],
    ["longitude", 180],
  ] as const) {
    const text = draft[key].trim()

    errors[key] =
      !!text &&
      (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) ||
        !Number.isFinite(Number(text)) ||
        Math.abs(Number(text)) > bound)
  }

  if (!!draft.latitude.trim() !== !!draft.longitude.trim())
    errors.latitude = errors.longitude = true
  for (const [locale, text] of Object.entries(draft.pickupInstructions))
    errors[`pickup-${locale}`] = text.trim().length > 1000

  return Object.fromEntries(
    Object.entries(errors).filter(([, invalid]) => invalid)
  )
}

export function establishmentInput(
  tenantId: string,
  saved: EstablishmentSettings,
  draft: EstablishmentDraft
): EstablishmentInput {
  const nullable = (text: string) => text.trim() || null

  return {
    tenantId,
    establishmentVersion: saved.establishmentVersion,
    name: draft.name.trim(),
    phone: nullable(draft.phone),
    addressLine1: nullable(draft.addressLine1),
    addressLine2: nullable(draft.addressLine2),
    postalCode: nullable(draft.postalCode),
    city: nullable(draft.city),
    region: nullable(draft.region),
    countryCode: nullable(draft.countryCode),
    timeZone: draft.timeZone,
    latitude: draft.latitude.trim() ? Number(draft.latitude) : null,
    longitude: draft.longitude.trim() ? Number(draft.longitude) : null,
    pickupInstructions: Object.fromEntries(
      Object.entries(draft.pickupInstructions).map(([locale, text]) => [
        locale,
        text.trim(),
      ])
    ),
  }
}

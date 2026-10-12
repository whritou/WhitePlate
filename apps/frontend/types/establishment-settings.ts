import type { ApiResult } from "./api"

export type OpeningHoursWindow = { start: string; end: string }
export type OpeningHoursDay = {
  dayOfWeek: number
  isClosed: boolean
  windows: OpeningHoursWindow[]
}
export type OpeningHoursSchedule = { days: OpeningHoursDay[] }

export type PublicEstablishment = {
  name: string
  phone: string | null
  addressLine1: string | null
  addressLine2: string | null
  postalCode: string | null
  city: string | null
  region: string | null
  countryCode: string | null
  latitude: number | null
  longitude: number | null
  timeZone: string
  pickupInstruction: string | null
  pickupLocale: string | null
  openingHours: OpeningHoursSchedule | null
}

export type EstablishmentSettings = Omit<
  PublicEstablishment,
  "pickupInstruction" | "pickupLocale"
> & {
  pickupInstructions: Record<string, string>
  establishmentVersion: number
  locales: string[]
  defaultLocale: string
}

export type EstablishmentOptions = { timeZones: string[]; countries: string[] }
export type EstablishmentRead = {
  settings: EstablishmentSettings
  options: EstablishmentOptions
}
export type EstablishmentInput = Omit<
  EstablishmentSettings,
  "locales" | "defaultLocale" | "openingHours"
> & { tenantId: string }
export type EstablishmentDraft = Record<
  | "name"
  | "phone"
  | "addressLine1"
  | "addressLine2"
  | "postalCode"
  | "city"
  | "region"
  | "countryCode"
  | "latitude"
  | "longitude"
  | "timeZone",
  string
> & { pickupInstructions: Record<string, string> }
export type EstablishmentEditorProps = {
  tenantId: string
  userId: string
  initial: EstablishmentRead | null
}
export type EstablishmentSave = (
  input: unknown
) => Promise<ApiResult<EstablishmentSettings>>
export type EstablishmentTextField = {
  key: keyof Omit<EstablishmentDraft, "pickupInstructions">
  max: number
  required?: boolean
  type?: "text" | "tel"
}
export type EstablishmentFormProps = {
  tenantId: string
  value: EstablishmentRead
  save: EstablishmentSave
  reload: () => Promise<EstablishmentRead | null>
  onSaved: (settings: EstablishmentSettings) => void | Promise<void>
  onAccessLost: () => void
}
export type EstablishmentFieldsProps = {
  draft: EstablishmentDraft
  options: EstablishmentOptions
  locales: string[]
  defaultLocale: string
  errors: Record<string, boolean>
  change: (draft: EstablishmentDraft) => void
}

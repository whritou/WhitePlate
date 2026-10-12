import { isRecord } from "./common"
import type {
  LegalProfileValues,
  TenantLegalProfile,
} from "@/types/establishment-settings"

function parseValues(value: unknown): LegalProfileValues | null {
  if (!isRecord(value)) return null

  const keys = [
    "countryCode",
    "name",
    "registrationNumber",
    "taxIdentifier",
  ] as const

  if (
    !keys.every((key) => value[key] === null || typeof value[key] === "string")
  )
    return null

  return {
    countryCode: value.countryCode as string | null,
    name: value.name as string | null,
    registrationNumber: value.registrationNumber as string | null,
    taxIdentifier: value.taxIdentifier as string | null,
  }
}

export function parseTenantLegalProfile(
  value: unknown
): TenantLegalProfile | null {
  if (
    !isRecord(value) ||
    (value.mode !== "inherit" && value.mode !== "custom") ||
    typeof value.version !== "number" ||
    !Number.isSafeInteger(value.version) ||
    value.version < 1
  )
    return null

  const organizationProfile = parseValues(value.organizationProfile)
  const effectiveProfile = parseValues(value.effectiveProfile)

  return organizationProfile && effectiveProfile
    ? {
        mode: value.mode,
        organizationProfile,
        effectiveProfile,
        version: value.version,
      }
    : null
}

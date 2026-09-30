export type ApiLocale = "en" | "fr"

type TenantResource = "details" | "menu"

function normalizeTenantId(tenantId: string): string {
  const normalized = tenantId.trim().toLowerCase()
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(normalized)) {
    throw new Error("Invalid tenant identifier")
  }
  return normalized
}

function tenantResourceKey(
  tenantId: string,
  locale: string,
  resource: TenantResource
) {
  if (locale !== "en" && locale !== "fr") {
    throw new Error("Unsupported locale")
  }

  return [
    "whiteplate",
    "tenant",
    normalizeTenantId(tenantId),
    locale,
    resource,
  ] as const
}

export const tenantApiQueryKeys = {
  tenant: (tenantId: string, locale: string) =>
    tenantResourceKey(tenantId, locale, "details"),
  menu: (tenantId: string, locale: string) =>
    tenantResourceKey(tenantId, locale, "menu"),
}

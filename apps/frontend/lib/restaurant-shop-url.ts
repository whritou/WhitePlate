import { getTenantSlug } from "./api/tenant-routing"

export function restaurantShopUrl(
  slug: string | undefined,
  domain: string | undefined,
  locale: string
): string | null {
  if (!slug || !domain || !["en", "fr"].includes(locale)) return null

  const host = `${slug}.${domain}`

  if (getTenantSlug(host, domain) !== slug) return null

  return `https://${host}/${locale}`
}

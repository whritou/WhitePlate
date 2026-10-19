import { getTenantSlug } from "./api/tenant-routing"
import { getStorefrontPreviewRewrite } from "./storefront-preview-routing"

export function restaurantShopUrl(
  slug: string | undefined,
  domain: string | undefined,
  locale: string,
  pathBaseDomain?: string,
  requestHost?: string | null
): string | null {
  if (!slug || !["en", "fr"].includes(locale)) return null

  const previewPath = getStorefrontPreviewRewrite(
    requestHost ?? null,
    `/${locale}/${slug}`,
    pathBaseDomain
  )

  if (previewPath) return `/${locale}/${slug}`

  if (!domain) return null

  const host = `${slug}.${domain}`

  if (getTenantSlug(host, domain) !== slug) return null

  return `https://${host}/${locale}`
}

import { getTenantApiBaseUrl, getTenantSlug } from "./api/tenant-routing"
import { isUuid } from "./validation/common"
import type {
  PublicStorefrontApiTarget,
  PublicStorefrontTarget,
} from "@/types/storefront-preview"

const restaurantSlugPattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

export function getStorefrontPreviewRewrite(
  hostHeader: string | null,
  pathname: string,
  configuredPathDomain: string | undefined
) {
  if (!isConfiguredHostname(hostHeader, configuredPathDomain)) return null

  const segments = pathname.split("/")
  const locale = segments[1]
  const restaurantSlug = segments[2]

  if ((locale !== "en" && locale !== "fr") || !isRestaurantSlug(restaurantSlug))
    return null

  if (segments.length === 3) {
    return {
      locale,
      restaurantSlug,
      rewritePath: `/${locale}/storefront-preview/${restaurantSlug}`,
    }
  }

  const orderId = segments[4]

  if (segments.length !== 5 || segments[3] !== "order" || !isUuid(orderId))
    return null

  return {
    locale,
    restaurantSlug,
    rewritePath: `/${locale}/storefront-preview/${restaurantSlug}/order/${orderId}`,
  }
}

export function resolvePublicStorefrontTarget(
  hostHeader: string | null,
  requestedRestaurantSlug: string | null | undefined,
  domains: {
    baseDomain: string | undefined
    pathBaseDomain: string | undefined
  }
): PublicStorefrontTarget | null {
  if (requestedRestaurantSlug !== undefined) {
    if (!isRestaurantSlug(requestedRestaurantSlug)) return null

    if (isConfiguredHostname(hostHeader, domains.pathBaseDomain))
      return { kind: "path", restaurantSlug: requestedRestaurantSlug }

    const hostSlug = getTenantSlug(hostHeader, domains.baseDomain)

    return hostSlug === requestedRestaurantSlug
      ? { kind: "host", restaurantSlug: hostSlug }
      : null
  }

  const hostSlug = getTenantSlug(hostHeader, domains.baseDomain)

  return hostSlug ? { kind: "host", restaurantSlug: hostSlug } : null
}

export function createPublicStorefrontApiTarget(
  hostHeader: string | null,
  requestedRestaurantSlug: string | null | undefined,
  configuration: {
    baseDomain: string | undefined
    apiTemplate: string | undefined
    pathBaseDomain: string | undefined
    centralApiUrl: string | undefined
  }
): PublicStorefrontApiTarget | null {
  const target = resolvePublicStorefrontTarget(
    hostHeader,
    requestedRestaurantSlug,
    configuration
  )

  if (!target) return null

  const apiBaseUrl =
    target.kind === "path"
      ? configuration.centralApiUrl
      : getTenantApiBaseUrl(
          target.restaurantSlug,
          configuration.apiTemplate,
          configuration.baseDomain
        )
  const apiPrefix =
    target.kind === "path"
      ? `/api/v1/public/restaurants/${target.restaurantSlug}`
      : "/api/v1"

  return { ...target, apiBaseUrl, apiPrefix }
}

export function isRestaurantSlug(
  value: string | undefined | null
): value is string {
  return typeof value === "string" && restaurantSlugPattern.test(value)
}

export function getRestaurantSlugSelector(
  requestUrl: string
): string | undefined | null {
  const selectors = new URL(requestUrl).searchParams.getAll("restaurantSlug")

  if (selectors.length > 1) return null

  return selectors[0]
}

export function appendRestaurantSlugQuery(
  pathname: string,
  restaurantSlug?: string
): string {
  if (!isRestaurantSlug(restaurantSlug)) return pathname

  const url = new URL(pathname, "https://whiteplate.invalid")

  url.searchParams.set("restaurantSlug", restaurantSlug)

  return `${url.pathname}${url.search}${url.hash}`
}

export function getStorefrontMenuHref(
  restaurantSlug: string | undefined,
  menuLocale: string,
  step?: "shop" | "checkout"
): string {
  const pathname = restaurantSlug ? `/${restaurantSlug}` : "/"
  const query = new URLSearchParams({ menuLocale })

  if (step === "checkout") query.set("step", step)

  return `${pathname}?${query}`
}

export function getStorefrontTrackingHref(
  restaurantSlug: string | undefined,
  orderId: string,
  token: string
): string {
  const pathname = restaurantSlug
    ? `/${restaurantSlug}/order/${orderId}`
    : `/order/${orderId}`

  return `${pathname}#${token}`
}

function isConfiguredHostname(
  hostHeader: string | null,
  configuredDomain: string | undefined
): boolean {
  const hostname = parseHostname(hostHeader)
  const configuredHostname = parseConfiguredHostname(configuredDomain)

  return Boolean(
    hostname && configuredHostname && hostname === configuredHostname
  )
}

function parseHostname(value: string | null): string | null {
  if (
    !value ||
    value.length > 255 ||
    !/^[a-z0-9.-]+(?::[0-9]{1,5})?$/i.test(value)
  )
    return null

  try {
    const parsed = new URL(`http://${value}`)

    return parsed.username || parsed.password
      ? null
      : parsed.hostname.toLowerCase()
  } catch {
    return null
  }
}

function parseConfiguredHostname(value: string | undefined): string | null {
  if (!value) return null

  try {
    const parsed = new URL(`http://${value}`)

    if (
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.port ||
      parsed.search ||
      parsed.hash ||
      parsed.hostname.split(".").some((part) => !part)
    )
      return null

    return parsed.hostname.toLowerCase()
  } catch {
    return null
  }
}

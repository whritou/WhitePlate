export function getTenantSlug(
  hostHeader: string | null,
  configuredDomain: string | undefined
): string | null {
  if (
    !hostHeader ||
    !configuredDomain ||
    hostHeader.length > 255 ||
    !/^[a-z0-9.-]+(?::[0-9]{1,5})?$/i.test(hostHeader)
  )
    return null
  try {
    const incoming = new URL(`http://${hostHeader}`)
    const configured = new URL(`http://${configuredDomain}`)

    if (
      configured.username ||
      configured.password ||
      configured.pathname !== "/" ||
      configured.port ||
      configured.search ||
      configured.hash ||
      configured.hostname.split(".").some((part) => !part)
    )
      return null

    const suffix = `.${configured.hostname.toLowerCase()}`
    const hostname = incoming.hostname.toLowerCase()

    if (!hostname.endsWith(suffix)) return null

    const slug = hostname.slice(0, -suffix.length)

    return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(slug) ? slug : null
  } catch {
    return null
  }
}

export function getTenantApiBaseUrl(
  tenantSlug: string,
  template: string | undefined,
  configuredDomain: string | undefined
): string | undefined {
  if (!template || !configuredDomain || template.split("{tenant}").length !== 2)
    return undefined
  try {
    const target = new URL(template.replace("{tenant}", tenantSlug))
    const domain = new URL(`http://${configuredDomain}`).hostname.toLowerCase()

    if (
      (target.protocol !== "http:" && target.protocol !== "https:") ||
      (process.env.NODE_ENV === "production" && target.protocol !== "https:") ||
      target.username ||
      target.password ||
      target.hostname.toLowerCase() !== `${tenantSlug}.${domain}` ||
      target.pathname !== "/" ||
      target.search ||
      target.hash
    )
      return undefined

    return target.origin
  } catch {
    return undefined
  }
}

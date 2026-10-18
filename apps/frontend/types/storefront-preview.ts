export type PublicStorefrontTarget = {
  kind: "host" | "path"
  restaurantSlug: string
}

export type PublicStorefrontApiTarget = PublicStorefrontTarget & {
  apiBaseUrl: string | undefined
  apiPrefix: string
}

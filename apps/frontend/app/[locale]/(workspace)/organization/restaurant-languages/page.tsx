import { getLocale } from "next-intl/server"
import { redirect } from "next/navigation"
import type { CatalogPageProps } from "@/types/catalog-management"

export default async function RestaurantMenuLanguagesPage({
  searchParams,
}: CatalogPageProps) {
  const [locale, query] = await Promise.all([getLocale(), searchParams])
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item))
    else if (value !== undefined) params.set(key, value)
  }

  params.set("view", "translations")
  redirect(`/${locale}/organization/catalog?${params}`)
}

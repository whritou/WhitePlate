import "server-only"
import { auth } from "@/lib/auth"
import { isUuid } from "@/lib/validation/common"
import { getRestaurantMemberships } from "./orders"
import { getLocale } from "next-intl/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export async function getManagedWorkspaceRestaurant(tenantId: unknown) {
  const locale = await getLocale()
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect(`/${locale}/sign-in`)
  if (!session.user.emailVerified) redirect(`/${locale}/verify-email`)
  if (!isUuid(tenantId)) return null

  const response = await getRestaurantMemberships()

  if (!response.ok) return null

  const restaurant = response.data?.find(
    (item) => item.id === tenantId && item.role !== "Kitchen"
  )

  return restaurant ? { ...restaurant, userId: session.user.id } : null
}

"use client"

import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"

export function SignOutButton() {
  const router = useRouter()
  const t = useTranslations("Auth")
  return <Button variant="outline" className="rounded-lg" onClick={async () => {
    await authClient.signOut()
    router.push("/sign-in")
  }}>{t("signOutAction")}</Button>
}

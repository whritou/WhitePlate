"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { useRouter } from "@/i18n/navigation"

export function SignOutButton() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const t = useTranslations("Auth")
  return (
    <Button
      variant="outline"
      className="rounded-lg"
      onClick={async () => {
        await authClient.signOut()
        queryClient.clear()
        router.push("/sign-in")
      }}
    >
      {t("signOutAction")}
    </Button>
  )
}

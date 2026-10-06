"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "@/i18n/navigation"
import { authClient } from "@/lib/auth-client"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"

export function SignOutButton() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const t = useTranslations("Auth")

  return (
    <Button
      variant="outline"

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

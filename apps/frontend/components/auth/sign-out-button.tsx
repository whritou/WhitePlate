"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
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
      <LogOut
        aria-hidden="true"
        className="hidden size-4 max-[39.99rem]:block"
      />

      <span className="max-[39.99rem]:sr-only">{t("signOutAction")}</span>
    </Button>
  )
}

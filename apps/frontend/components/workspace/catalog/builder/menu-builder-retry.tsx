"use client"

import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"

export function MenuBuilderRetry() {
  const router = useRouter()
  const t = useTranslations("MenuBuilder")
  const [pending, startTransition] = useTransition()

  return (
    <Button
      className="mt-4"
      variant="outline"
      disabled={pending}
      aria-busy={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      {t(pending ? "loading" : "retry")}
    </Button>
  )
}

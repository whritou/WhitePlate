"use client"

import { Info } from "lucide-react"
import { useTranslations } from "next-intl"

export function DemoNotice() {
  const t = useTranslations("Redesign")

  return (
    <p className="mx-auto flex max-w-7xl items-start justify-center gap-2 px-4 py-3 text-xs leading-5 text-muted-foreground">
      <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />

      {t("demoNotice")}
    </p>
  )
}

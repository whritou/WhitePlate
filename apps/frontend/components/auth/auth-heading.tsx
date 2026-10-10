"use client"

import { useTranslations } from "next-intl"
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function AuthHeading({
  title,
  description,
}: {
  title: string
  description: string
}) {
  const t = useTranslations("LovableLive")

  return (
    <CardHeader className="mb-0 px-0">
      <p className="mb-8 flex items-center gap-2 text-sm text-primary">
        <span className="size-2 bg-primary" />

        {t("restaurantWorkspace")}
      </p>

      <CardTitle className="font-display text-4xl leading-tight font-bold tracking-normal text-foreground">
        <h1 className="font-display text-4xl leading-tight font-bold tracking-normal">
          {title}
        </h1>
      </CardTitle>

      <CardDescription className="mt-3 text-sm">{description}</CardDescription>
    </CardHeader>
  )
}

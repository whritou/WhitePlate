"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useTranslations } from "next-intl"

export function OrderEmailPreview({
  restaurantName,
  subject,
  heading,
  body,
}: {
  restaurantName: string
  subject: string
  heading: string
  body: string
}) {
  const t = useTranslations("OrderEmailSettings")
  const [size, setSize] = useState<"mobile" | "desktop">("mobile")

  return (
    <Card aria-label={t("preview")}>
      <CardHeader>
        <CardTitle>{t("preview")}</CardTitle>

        <CardDescription>{t("previewDescription")}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid gap-3">
          <div
            className="flex justify-end gap-2"
            role="group"
            aria-label={t("previewSize")}
          >
            <Button
              type="button"
              variant={size === "mobile" ? "default" : "outline"}
              aria-pressed={size === "mobile"}
              onClick={() => setSize("mobile")}
            >
              {t("previewMobile")}
            </Button>

            <Button
              type="button"
              variant={size === "desktop" ? "default" : "outline"}
              aria-pressed={size === "desktop"}
              onClick={() => setSize("desktop")}
            >
              {t("previewDesktop")}
            </Button>
          </div>

          <article
            className={
              size === "mobile"
                ? "mx-auto w-full max-w-[20rem] overflow-hidden rounded-lg border bg-background"
                : "mx-auto w-full max-w-2xl overflow-hidden rounded-lg border bg-background"
            }
          >
            <header className="border-b bg-primary px-5 py-4 text-primary-foreground">
              <p className="text-center font-semibold">{restaurantName}</p>

              <p className="mt-1 text-center text-xs">WhitePlate</p>
            </header>

            <div className="grid gap-4 p-5">
              <p className="text-xs text-muted-foreground">{subject}</p>

              <h3 className="font-display text-xl font-bold">{heading}</h3>

              <p className="text-sm leading-6 whitespace-pre-line">{body}</p>
            </div>
          </article>
        </div>
      </CardContent>
    </Card>
  )
}

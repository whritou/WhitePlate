"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Clock, CreditCard, ShoppingBag, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function CheckoutIllustration() {
  const t = useTranslations("Redesign")
  const [scheduled, setScheduled] = useState(false)
  const [method, setMethod] = useState("store")

  return (
    <div className="grid gap-6">
      <p className="text-xs leading-5 text-muted-foreground">
        {t("futureControlsNotice")}
      </p>

      <Card className="border-0 p-6">
        <CardHeader className="px-0">
          <CardTitle className="flex items-center gap-3 text-xl">
            <ShoppingBag aria-hidden="true" className="text-primary" />

            {t("fulfillmentTitle")}
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-5 px-0">
          <div
            role="group"
            aria-label={t("fulfillmentTitle")}
            className="grid gap-3 sm:grid-cols-2"
          >
            {[false, true].map((later) => (
              <Button
                key={String(later)}
                variant="secondary"
                aria-pressed={scheduled === later}
                onClick={() => setScheduled(later)}
                className={`min-h-24 gap-3 ${scheduled === later ? "ring-1 ring-primary" : ""}`}
              >
                <Clock aria-hidden="true" />

                <span className="grid gap-2 text-left">
                  <strong>{t(later ? "scheduleLater" : "asap")}</strong>

                  <span className="text-xs font-normal">
                    {t(later ? "reservedSlot" : "readyAt")}
                  </span>
                </span>
              </Button>
            ))}
          </div>

          <div className="map-preview grid h-48 place-items-center rounded-lg">
            <MapPin
              aria-hidden="true"
              className="size-12 rounded-full bg-primary p-3 text-primary-foreground shadow-xl"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 p-6">
        <CardHeader className="px-0">
          <CardTitle className="flex items-center gap-3 text-xl">
            <CreditCard aria-hidden="true" className="text-primary" />

            {t("paymentTitle")}
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-5 px-0">
          <div
            role="group"
            aria-label={t("paymentTitle")}
            className="flex flex-wrap gap-3"
          >
            {["apple", "google", "store"].map((value) => (
              <Button
                key={value}
                variant={method === value ? "default" : "secondary"}
                aria-pressed={method === value}
                onClick={() => setMethod(value)}
              >
                {t(`pay${value}`)}
              </Button>
            ))}
          </div>

          <p className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
            {t("cardPreview")}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

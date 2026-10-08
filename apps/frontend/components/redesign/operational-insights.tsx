"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { QrCode } from "lucide-react"

export function OperationalInsights() {
  const t = useTranslations("Redesign")
  const [stock, setStock] = useState([true, false, true])

  return (
    <aside className="grid min-w-0 gap-6">
      <Card className="gap-5 border-0 p-5">
        <CardHeader className="flex flex-wrap items-start justify-between gap-2 p-0">
          <CardTitle>
            <h2 className="text-base">{t("rushPacing")}</h2>
          </CardTitle>

          <Badge variant="warning">{t("lunchSurge")}</Badge>
        </CardHeader>

        <CardContent className="p-0">
          <p className="text-xs text-muted-foreground">{t("hourlyVolume")}</p>

          <div
            role="img"
            aria-label={t("rushChartDescription")}
            className="mt-6 flex h-40 items-end justify-between gap-2"
          >
            {[24, 46, 80, 57, 33, 40, 69].map((height, index) => (
              <div
                key={index}
                className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2 text-center"
              >
                <div
                  className={`rounded-t-md ${index === 2 ? "bg-primary" : index === 3 ? "bg-warning-muted" : "bg-secondary"}`}
                  style={{ height: `${height}%` }}
                />

                <span className="text-xs text-muted-foreground">
                  {["10h", "11h", "12h", "13h", "14h", "17h", "18h"][index]}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            {t("peakWindow")}
          </p>
        </CardContent>
      </Card>

      <Card className="gap-5 border-0 p-5">
        <CardHeader className="p-0">
          <CardTitle>
            <h2 className="text-base">{t("topMovers")}</h2>
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 p-0">
          {["burger", "fries", "craftDrinks"].map((product, index) => (
            <div key={product}>
              <p className="mb-2 flex justify-between gap-2 text-xs">
                <span>{t(product)}</span>

                <strong>{[38, 27, 19][index]}%</strong>
              </p>

              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className={
                    index === 0
                      ? "h-full rounded-full bg-primary"
                      : "h-full rounded-full bg-success-solid"
                  }
                  style={{ width: `${[38, 27, 19][index]}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="gap-5 border-0 p-5">
        <CardHeader className="p-0">
          <CardTitle>
            <h2 className="text-base">{t("stockManager")}</h2>
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-3 p-0">
          <p className="mb-1 text-xs leading-5 text-muted-foreground">
            {t("stockDescription")}
          </p>

          {["truffleDip", "glutenFreeBun", "vanillaShake"].map(
            (item, index) => (
              <Label
                key={item}
                className="flex items-center justify-between gap-4 rounded-md bg-muted p-3"
              >
                <span className="text-sm">
                  <strong>{t(item)}</strong>

                  <span
                    className={`mt-1 block text-xs ${stock[index] ? "text-muted-foreground" : "text-destructive"}`}
                  >
                    {stock[index] ? t("inStock") : t("outOfStock")}
                  </span>
                </span>

                <Checkbox
                  aria-label={t(item)}
                  checked={stock[index]}
                  onCheckedChange={(checked) =>
                    setStock((current) =>
                      current.map((value, i) => (i === index ? checked : value))
                    )
                  }
                />
              </Label>
            )
          )}
        </CardContent>
      </Card>

      <Card className="flex-row items-center gap-4 border-0 bg-obsidian p-5 text-white">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase">{t("liveCustomerStore")}</p>

          <p className="mt-2 font-heading font-bold break-all">
            artisan.whiteplate.example
          </p>

          <p className="mt-2 text-xs text-white/70">{t("qrDescription")}</p>

          <Button
            size="sm"
            nativeButton={false}
            render={<Link href="/demo" />}
            className="mt-4"
          >
            {t("kioskView")}
          </Button>
        </div>

        <QrCode
          aria-hidden="true"
          className="size-20 shrink-0 rounded-md bg-white p-2 text-obsidian"
        />
      </Card>

      <p className="text-xs text-muted-foreground">{t("insightsNotice")}</p>
    </aside>
  )
}

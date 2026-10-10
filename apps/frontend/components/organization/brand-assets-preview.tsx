"use client"

import { Monitor, Smartphone } from "lucide-react"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BrandAssetImage } from "@/components/brand/asset-image"
import { brandPreviewUrl } from "@/lib/brand-assets"
import type { BrandPreviewProps, BrandSlot } from "@/types/brand-assets"

export function BrandAssetsPreview({
  tenantId,
  restaurantName,
  assets,
  drafts,
}: BrandPreviewProps) {
  const t = useTranslations("BrandAssets")
  const [mobile, setMobile] = useState(true)
  const source = (slot: BrandSlot) => {
    const active = assets.find((asset) => asset.slot === slot)

    return (
      drafts[slot] ??
      (active ? brandPreviewUrl(tenantId, active.id) : undefined)
    )
  }

  return (
    <aside
      className="min-w-0 xl:sticky xl:top-24 xl:self-start"
      aria-label={t("preview")}
    >
      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="grid gap-1">
            <h2 className="font-heading font-semibold">{t("preview")}</h2>

            <p className="text-xs text-muted-foreground">{t("previewHelp")}</p>
          </div>

          <div
            role="group"
            aria-label={t("previewSize")}
            className="flex flex-wrap gap-0 border bg-background p-0"
          >
            <Button
              variant={mobile ? "secondary" : "ghost"}
              aria-pressed={mobile}
              className="min-h-11 md:min-h-12"
              onClick={() => setMobile(true)}
            >
              <Smartphone aria-hidden="true" />

              {t("mobile")}
            </Button>

            <Button
              variant={!mobile ? "secondary" : "ghost"}
              aria-pressed={!mobile}
              className="min-h-11 md:min-h-12"
              onClick={() => setMobile(false)}
            >
              <Monitor aria-hidden="true" />

              {t("desktop")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="border bg-secondary p-6">
        <div
          className={`mx-auto overflow-hidden border border-border bg-card ${mobile ? "max-w-[24.375rem]" : "w-full"}`}
        >
          <div className="flex min-w-0 items-center gap-2 border-b border-border p-3 text-xs text-muted-foreground">
            <BrandAssetImage
              key={source("favicon") ?? "favicon"}
              src={source("favicon")}
              label={t("faviconFallback")}
              className="size-8 shrink-0 rounded-md"
            />

            <span className="min-w-0 truncate">{restaurantName}</span>
          </div>

          <BrandAssetImage
            key={source("banner") ?? "banner"}
            src={source("banner")}
            label={t("bannerFallback")}
            className="aspect-video w-full"
          />

          <div className="grid min-w-0 grid-cols-1 gap-4 p-3 sm:p-6">
            <BrandAssetImage
              key={source("logo") ?? "logo"}
              src={source("logo")}
              label={t("logoFallback")}
              className="size-16 rounded-lg border border-border bg-card"
            />

            <h3 className="font-heading text-2xl font-semibold break-words">
              {restaurantName}
            </h3>

            <p className="text-sm/relaxed text-muted-foreground">
              {t("previewDescription")}
            </p>

            <Badge variant="neutral" className="max-w-full whitespace-normal">
              {t(
                Object.values(drafts).some(Boolean)
                  ? "draftPreview"
                  : "savedPreview"
              )}
            </Badge>
          </div>
        </div>
      </div>
    </aside>
  )
}

"use client"

import Image from "next/image"
import {
  Check,
  Clock,
  Heart,
  MapPin,
  Share2,
  ShoppingBag,
  Star,
} from "lucide-react"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { BrandAssetImage } from "@/components/brand/asset-image"

export function RestaurantIdentity({
  name,
  description,
  children,
  illustrative = false,
}: {
  name: string
  description?: string | null
  children?: React.ReactNode
  illustrative?: boolean
}) {
  const t = useTranslations("Redesign")
  const brand = useTranslations("BrandAssets")
  const [favorite, setFavorite] = useState(false)
  const [shared, setShared] = useState(false)

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShared(true)
    } catch {
      setShared(false)
    }
  }

  return (
    <section className="relative">
      <div className="relative h-56 overflow-hidden bg-foreground sm:h-72 lg:h-80">
        {illustrative ? (
          <Image
            src="/design/photo-13.webp"
            alt=""
            fill
            sizes="100vw"
            preload
            className="object-cover brightness-75"
          />
        ) : (
          <BrandAssetImage
            src="/api/public/brand-assets/banner"
            label={brand("bannerFallback")}
            cover
            className="h-full w-full"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/30 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto -mt-16 max-w-7xl px-4 sm:-mt-20 sm:px-6 lg:px-8">
        <Card className="gap-5 border-0 bg-card p-4 shadow-lg sm:p-6 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex min-w-0 flex-1 basis-64 flex-col items-start gap-3 sm:flex-row sm:gap-4">
              {illustrative ? (
                <Image
                  src="/design/photo-14.webp"
                  width={88}
                  height={88}
                  alt=""
                  className="size-16 shrink-0 rounded-lg object-cover sm:size-22"
                />
              ) : (
                <BrandAssetImage
                  src="/api/public/brand-assets/logo"
                  label={brand("logoFallback")}
                  className="size-16 shrink-0 rounded-lg bg-card sm:size-22"
                />
              )}

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-heading text-headline-md sm:text-headline-lg">
                    {name}
                  </h1>

                  {illustrative && (
                    <Badge variant="neutral">{t("downtownStore")}</Badge>
                  )}
                </div>

                {illustrative && (
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Star
                      className="size-4 fill-primary text-primary"
                      aria-hidden="true"
                    />

                    <strong className="text-foreground">4.8</strong>

                    {t("reviews")}

                    <span aria-hidden="true">•</span>

                    {t("gourmetBurgers")}

                    <span aria-hidden="true">•</span>

                    {t("glutenFree")}
                  </p>
                )}

                {description && (
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void share()}
              >
                <Share2 aria-hidden="true" />

                {shared ? t("copied") : t("share")}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                aria-pressed={favorite}
                onClick={() => setFavorite(!favorite)}
              >
                <Heart
                  aria-hidden="true"
                  className={favorite ? "fill-primary text-primary" : ""}
                />

                {t("favorite")}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-muted p-4">
            <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:flex xl:flex-wrap xl:gap-5">
              <IdentityDetail
                icon={<ShoppingBag />}
                label={t("fulfillment")}
                value={t("clickCollect")}
              />

              {illustrative && (
                <>
                  <IdentityDetail
                    icon={<Clock />}
                    label={t("prepTime")}
                    value={t("prepValue")}
                  />

                  <IdentityDetail
                    icon={<MapPin />}
                    label={t("pickupCounter")}
                    value={t("address")}
                  />

                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="size-2 rounded-full bg-success-solid" />

                    {t("openUntil")}
                  </p>
                </>
              )}
            </div>

            {children ?? (
              <Badge variant="success">
                <Check aria-hidden="true" />

                {t("directOrdering")}
              </Badge>
            )}
          </div>
        </Card>
      </div>
    </section>
  )
}

function IdentityDetail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-foreground [&_svg]:size-5"
      >
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>

        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  )
}

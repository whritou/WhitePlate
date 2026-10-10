"use client"
import type { ReactNode } from "react"
import { BrandAssetImage } from "@/components/brand/asset-image"
import { useTranslations } from "next-intl"
export function LiveRestaurantIdentity({
  name,
  description,
  children,
}: {
  name: string
  description: string | null
  children?: ReactNode
}) {
  const t = useTranslations("BrandAssets")

  return (
    <section className="relative border-b">
      <div className="relative h-[300px] bg-secondary">
        <BrandAssetImage
          src="/api/public/brand-assets/banner"
          label={t("bannerFallback")}
          cover
          className="h-full w-full"
        />

        <div className="absolute inset-0 bg-ink/65" />

        <div className="absolute inset-0 flex flex-col justify-end gap-3 p-6 text-ink-foreground sm:p-8">
          <h1 className="font-display text-4xl font-bold wrap-anywhere">
            {name}
          </h1>

          {description && (
            <p className="max-w-2xl text-sm wrap-anywhere">{description}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4 px-6 py-4">{children}</div>
    </section>
  )
}

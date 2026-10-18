"use client"
import type { ReactNode } from "react"
import { BrandAssetImage } from "@/components/brand/asset-image"
import { useTranslations } from "next-intl"
import type { StoreTheme } from "@/types/lovable/storeTheme"
export function LiveRestaurantIdentity({
  name,
  description,
  theme,
  children,
}: {
  name: string
  description: string | null
  theme: StoreTheme
  children?: ReactNode
}) {
  const t = useTranslations("BrandAssets")
  const hasBanner = theme.showBanner && Boolean(theme.banner)

  if (!theme.showBanner) return null

  return (
    <section className="relative border-b">
      <div
        className={`customer-banner relative flex items-center overflow-hidden px-6 py-8 ${theme.bannerAlign === "center" ? "justify-center text-center" : "text-left"}`}
        style={{
          minHeight: hasBanner ? "var(--customer-banner-height)" : "auto",
          backgroundColor: hasBanner ? undefined : "var(--background)",
          color: hasBanner ? "white" : "var(--foreground)",
        }}
      >
        {hasBanner && (
          <>
            <BrandAssetImage
              src={theme.banner}
              label={t("bannerFallback")}
              cover
              className="absolute inset-0 h-full w-full"
            />

            <div
              className="absolute inset-0 bg-black"
              style={{ opacity: theme.bannerOverlay / 100 }}
            />
          </>
        )}

        <div className="relative">
          <h1 className="mt-4 font-heading text-4xl leading-tight font-bold wrap-anywhere md:text-5xl">
            {name}
          </h1>

          {description && (
            <p className="max-w-2xl text-sm wrap-anywhere">{description}</p>
          )}
        </div>
      </div>

      {children && (
        <div className="flex flex-wrap items-end gap-4 px-6 py-4">
          {children}
        </div>
      )}
    </section>
  )
}

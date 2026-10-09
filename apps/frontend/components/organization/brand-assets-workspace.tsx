"use client"

import { ImageIcon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useState } from "react"
import { fetchBrandAssets } from "@/lib/api/brand-browser"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { BrandAssetSlot } from "./brand-asset-slot"
import { BrandAssetsPreview } from "./brand-assets-preview"
import type {
  BrandAsset,
  BrandAssets,
  BrandAssetsProps,
  BrandSlot,
} from "@/types/brand-assets"

export function BrandAssetsWorkspace({
  tenantId,
  userId,
  restaurantName,
  initialData,
}: BrandAssetsProps) {
  const t = useTranslations("BrandAssets")
  const locale = useLocale()
  const client = useQueryClient()
  const [drafts, setDrafts] = useState<Partial<Record<BrandSlot, string>>>({})
  const query = useQuery({
    queryKey: ["brand-assets", userId, tenantId, locale],
    queryFn: ({ signal }) => fetchBrandAssets(tenantId, signal),
    initialData,
    retry: false,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  })
  const onPreview = useCallback(
    (slot: BrandSlot, url?: string) =>
      setDrafts((current) => ({ ...current, [slot]: url })),
    []
  )
  const onSaved = useCallback(
    async (slot?: BrandSlot, asset?: BrandAsset | null) => {
      if (slot)
        client.setQueryData<BrandAssets>(
          ["brand-assets", userId, tenantId, locale],
          (current) =>
            current
              ? {
                  ...current,
                  assets: [
                    ...current.assets.filter((item) => item.slot !== slot),
                    ...(asset ? [asset] : []),
                  ],
                }
              : current
        )

      await query.refetch()
    },
    [client, userId, tenantId, locale, query]
  )
  const data = query.data
  const available = Boolean(data?.storageAvailable) && !query.isError

  return (
    <div className="grid min-w-0 grid-cols-1 gap-6 [overflow-wrap:anywhere]">
      <header className="grid gap-2">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase dark:text-primary">
          {t("eyebrow")}
        </p>

        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>

        <p className="max-w-2xl text-sm/relaxed text-muted-foreground">
          {t("description")}
        </p>
      </header>

      {(query.isError || (data && !data.storageAvailable)) && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            {t(query.isError ? "loadFailed" : "storageUnavailable")}
          </AlertDescription>

          <Button
            variant="outline"
            className="min-h-11 md:min-h-12"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {t("retry")}
          </Button>
        </Alert>
      )}

      {query.isPending && <p role="status">{t("loading")}</p>}

      {data && (
        <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Card className="@container">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-lg bg-secondary">
                  <ImageIcon aria-hidden="true" className="size-5" />
                </span>

                <div className="min-w-0 flex-1 basis-48">
                  <CardTitle>
                    <h2>{t("assetsTitle")}</h2>
                  </CardTitle>

                  <CardDescription>{t("assetsDescription")}</CardDescription>
                </div>

                <Badge variant="neutral">PNG / JPEG / WebP / ICO</Badge>
              </div>
            </CardHeader>

            <CardContent className="grid gap-4 @sm:grid-cols-2">
              {(["logo", "favicon", "banner"] as const).map((slot) => (
                <BrandAssetSlot
                  key={slot}
                  tenantId={tenantId}
                  slot={slot}
                  active={data.assets.find((asset) => asset.slot === slot)}
                  available={available}
                  onSaved={onSaved}
                  onPreview={onPreview}
                />
              ))}

              <p className="text-xs/relaxed text-muted-foreground @sm:col-span-2">
                {t("saveHelp")}
              </p>
            </CardContent>
          </Card>

          <BrandAssetsPreview
            restaurantName={restaurantName}
            tenantId={tenantId}
            assets={data.assets}
            drafts={drafts}
          />
        </div>
      )}
    </div>
  )
}

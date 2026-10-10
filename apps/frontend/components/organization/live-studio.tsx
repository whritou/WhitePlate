"use client"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { StudioPage } from "@/components/lovable/pages/studio"
import { Button } from "@/components/ui/button"
import { MissingFeatureNotice } from "./missing-feature-notice"
import { BrandAssetsWorkspace } from "./brand-assets-workspace"
import type { BrandAssetsProps } from "@/types/brand-assets"
export function LiveStudio(props: BrandAssetsProps) {
  const t = useTranslations("LiveWorkspace")
  const search = useSearchParams()
  const [panel, setPanel] = useState(
    search.get("panel") === "brand" ? "brand" : "appearance"
  )

  function changePanel(value: string) {
    setPanel(value)

    const url = new URL(window.location.href)

    url.searchParams.set("panel", value)
    window.history.replaceState(null, "", url.pathname + url.search + url.hash)
  }

  return (
    <div className="min-w-0">
      <div
        className="flex flex-wrap gap-2 border-b p-4"
        role="tablist"
        aria-label="Studio"
      >
        <Button
          role="tab"
          aria-selected={panel === "appearance"}
          variant={panel === "appearance" ? "secondary" : "ghost"}
          onClick={() => changePanel("appearance")}
        >
          {t("appearance")}
        </Button>

        <Button
          role="tab"
          aria-selected={panel === "brand"}
          variant={panel === "brand" ? "secondary" : "ghost"}
          onClick={() => changePanel("brand")}
        >
          {t("brandMedia")}
        </Button>
      </div>

      {panel === "brand" ? (
        <div className="live-page">
          <BrandAssetsWorkspace {...props} />
        </div>
      ) : (
        <>
          <div className="grid gap-3 p-6">
            <MissingFeatureNotice />

            <p className="text-sm text-muted-foreground">
              {t("studioPending")}
            </p>
          </div>

          <StudioPage
            storageKey={`whiteplate-live-draft:${props.userId}:${props.tenantId}:appearance`}
          />
        </>
      )}
    </div>
  )
}

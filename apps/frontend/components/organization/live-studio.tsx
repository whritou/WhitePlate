"use client"
import { useRef, useState, type KeyboardEvent } from "react"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { LiveThemeStudio } from "./live-theme-studio"
import { Button } from "@/components/ui/button"
import { BrandAssetsWorkspace } from "./brand-assets-workspace"
import type { LiveStudioProps } from "@/types/theme"
export function LiveStudio(props: LiveStudioProps) {
  const t = useTranslations("LiveWorkspace")
  const search = useSearchParams()
  const tabRefs = useRef<
    Record<"appearance" | "brand", HTMLButtonElement | null>
  >({
    appearance: null,
    brand: null,
  })
  const [panel, setPanel] = useState(
    search.get("panel") === "brand" ? "brand" : "appearance"
  )

  function changePanel(value: string) {
    setPanel(value)

    const url = new URL(window.location.href)

    url.searchParams.set("panel", value)
    window.history.replaceState(null, "", url.pathname + url.search + url.hash)
  }

  function onTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    current: "appearance" | "brand"
  ) {
    const next =
      event.key === "Home"
        ? "appearance"
        : event.key === "End"
          ? "brand"
          : event.key === "ArrowRight"
            ? current === "appearance"
              ? "brand"
              : "appearance"
            : event.key === "ArrowLeft"
              ? current === "brand"
                ? "appearance"
                : "brand"
              : null

    if (!next) return

    event.preventDefault()
    changePanel(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <div className="min-w-0">
      <div
        className="flex flex-wrap gap-2 border-b p-4"
        role="tablist"
        aria-label={t("studioTabs")}
      >
        <Button
          ref={(element) => {
            tabRefs.current.appearance = element
          }}
          id="studio-tab-appearance"
          role="tab"
          aria-selected={panel === "appearance"}
          aria-controls="studio-panel"
          tabIndex={panel === "appearance" ? 0 : -1}
          variant={panel === "appearance" ? "secondary" : "ghost"}
          onClick={() => changePanel("appearance")}
          onKeyDown={(event) => onTabKeyDown(event, "appearance")}
        >
          {t("appearance")}
        </Button>

        <Button
          ref={(element) => {
            tabRefs.current.brand = element
          }}
          id="studio-tab-brand"
          role="tab"
          aria-selected={panel === "brand"}
          aria-controls="studio-panel"
          tabIndex={panel === "brand" ? 0 : -1}
          variant={panel === "brand" ? "secondary" : "ghost"}
          onClick={() => changePanel("brand")}
          onKeyDown={(event) => onTabKeyDown(event, "brand")}
        >
          {t("brandMedia")}
        </Button>
      </div>

      <div
        id="studio-panel"
        role="tabpanel"
        aria-labelledby={`studio-tab-${panel}`}
        tabIndex={0}
      >
        {panel === "brand" ? (
          <div className="live-page">
            <BrandAssetsWorkspace {...props} />
          </div>
        ) : (
          <LiveThemeStudio {...props} />
        )}
      </div>
    </div>
  )
}

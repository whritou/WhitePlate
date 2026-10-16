"use client"
import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { LiveThemeStudio } from "./live-theme-studio"
import type { LiveStudioProps, StudioPanel } from "@/types/theme"
export function LiveStudio(props: LiveStudioProps) {
  const search = useSearchParams()
  const [panel, setPanel] = useState<StudioPanel>(
    search.get("panel") === "brand" ? "brand" : "design"
  )

  function changePanel(value: StudioPanel) {
    setPanel(value)

    const url = new URL(window.location.href)

    url.searchParams.set("panel", value === "design" ? "appearance" : value)
    window.history.replaceState(null, "", url.pathname + url.search + url.hash)
  }

  return (
    <div className="min-w-0">
      <LiveThemeStudio {...props} panel={panel} onPanelChange={changePanel} />
    </div>
  )
}

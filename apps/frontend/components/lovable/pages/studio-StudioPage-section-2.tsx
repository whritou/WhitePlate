"use client"
import { Copy } from "@/components/lovable/copy"
import { useTranslations } from "next-intl"
import { useRef, type KeyboardEvent } from "react"
import { Button } from "@/components/ui/lovable-button"
import type { StudioPanel } from "@/types/theme"
import { useStudioPageView } from "./studio-StudioPage-context"
import { StudioPageSection3 } from "./studio-StudioPage-section-3"
export function StudioPageSection2() {
  const { panel, setPanel, locked, connected } = useStudioPageView()
  const t = useTranslations("LiveWorkspace")
  const tabRefs = useRef<Record<StudioPanel, HTMLButtonElement | null>>({
    design: null,
    brand: null,
  })

  function onTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    current: StudioPanel
  ) {
    const next =
      event.key === "Home"
        ? "design"
        : event.key === "End"
          ? "brand"
          : event.key === "ArrowRight"
            ? current === "design"
              ? "brand"
              : "design"
            : event.key === "ArrowLeft"
              ? current === "brand"
                ? "design"
                : "brand"
              : null

    if (!next) return

    event.preventDefault()
    setPanel(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <aside className="max-h-[45vh] w-full shrink-0 space-y-7 overflow-y-auto border-r p-5 sm:max-h-none sm:w-72 lg:w-80">
      <div className="flex border" role="tablist" aria-label={t("studioTabs")}>
        <Copy>
          {(["design", "brand"] as const).map((p) => (
            <Button
              key={p}
              ref={(element) => {
                tabRefs.current[p] = element
              }}
              id={`studio-tab-${p}`}
              role="tab"
              aria-selected={panel === p}
              aria-controls="studio-panel"
              tabIndex={panel === p ? 0 : -1}
              variant={panel === p ? "secondary" : "ghost"}
              onClick={() => setPanel(p)}
              onKeyDown={(event) => onTabKeyDown(event, p)}
              className="flex-1 capitalize"
            >
              <Copy>{p === "brand" ? t("brandMedia") : t("appearance")}</Copy>
            </Button>
          ))}
        </Copy>
      </div>

      {!(connected && panel === "brand") && (
        <fieldset disabled={locked} className="min-w-0 space-y-7">
          <StudioPageSection3 />
        </fieldset>
      )}
    </aside>
  )
}

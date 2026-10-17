"use client"
import { Copy } from "@/components/lovable/copy"
import {
  SourceButton,
  SourceSelect,
  SourceOption,
} from "@/components/ui/lovable-controls"
import { RANGES } from "./analytics-shared"
import { useAnalyticsPageView } from "./analytics-AnalyticsPage-context"
import { AnalyticsPageSection1 } from "./analytics-AnalyticsPage-section-1"
import { useTranslations } from "next-intl"
export function AnalyticsPageView() {
  const { range, setRange, rest, setRest, restOptions, exportCsv, pageMode } = useAnalyticsPageView()
  const t = useTranslations("AnalyticsLive")

  return (
    <div className="min-h-screen bg-background">
      <section className="flex flex-wrap items-end justify-between gap-4 px-6 pt-8 pb-6">
        <div>
          <p className="label-mono flex items-center gap-2 text-muted-foreground">
            <span className={`h-2 w-2 ${pageMode === "demo" ? "animate-pulse bg-primary" : "bg-primary"}`} />{" "}
            {pageMode === "demo" ? <Copy>Sample data · browser demo</Copy> : t("liveData")}
          </p>

          <h1 className="mt-1 font-display text-4xl font-bold">
            {pageMode === "demo" ? <Copy>Analytics</Copy> : t("title")}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SourceSelect
            value={rest}
            onChange={(e) => setRest(+e.target.value)}
            className="label-mono border bg-background px-3 py-2.5"
            aria-label={t("restaurant")}
          >
            <Copy>
              {restOptions.map((r, i) => (
                <SourceOption key={r} value={i}>
                  <Copy>{r}</Copy>
                </SourceOption>
              ))}
            </Copy>
          </SourceSelect>

          <div className="flex border">
            <Copy>
              {RANGES.map(([k, l]) => (
                <SourceButton
                  key={k}
                  onClick={() => setRange(k)}
                  aria-pressed={range === k}
                  className={`label-mono px-3 py-2.5 ${range === k ? "bg-accent" : ""}`}
                >
                  <Copy>{pageMode === "live" ? t(k === "7" ? "range7" : k === "30" ? "range30" : "range90") : l}</Copy>
                </SourceButton>
              ))}
            </Copy>
          </div>

          <SourceButton onClick={exportCsv} className="btn-ghost py-2.5">
            {pageMode === "demo" ? <Copy>Export CSV</Copy> : t("exportCsv")}
          </SourceButton>
        </div>
      </section>

      <AnalyticsPageSection1 />
    </div>
  )
}

"use client"
import { Copy } from "@/components/lovable/copy"
import {
  SourceButton,
  SourceSelect,
  SourceOption,
} from "@/components/ui/lovable-controls"
import { RESTAURANTS, RANGES } from "./analytics-shared"
import { useAnalyticsPageView } from "./analytics-AnalyticsPage-context"
import { AnalyticsPageSection1 } from "./analytics-AnalyticsPage-section-1"
export function AnalyticsPageView() {
  const { range, setRange, rest, setRest, exportCsv } = useAnalyticsPageView()

  return (
    <div className="min-h-screen bg-background">
      <section className="flex flex-wrap items-end justify-between gap-4 px-6 pt-8 pb-6">
        <div>
          <p className="label-mono flex items-center gap-2 text-muted-foreground">
            <span className="h-2 w-2 animate-pulse bg-primary" />{" "}
            <Copy> Sample data · browser demo</Copy>
          </p>

          <h1 className="mt-1 font-display text-4xl font-bold">
            <Copy>Analytics</Copy>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SourceSelect
            value={rest}
            onChange={(e) => setRest(+e.target.value)}
            className="label-mono border bg-background px-3 py-2.5"
            aria-label="Restaurant"
          >
            <Copy>
              {RESTAURANTS.map((r, i) => (
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
                  className={`label-mono px-3 py-2.5 ${range === k ? "bg-accent" : ""}`}
                >
                  <Copy>{l}</Copy>
                </SourceButton>
              ))}
            </Copy>
          </div>

          <SourceButton onClick={exportCsv} className="btn-ghost py-2.5">
            <Copy>Export CSV</Copy>
          </SourceButton>
        </div>
      </section>

      <AnalyticsPageSection1 />
    </div>
  )
}

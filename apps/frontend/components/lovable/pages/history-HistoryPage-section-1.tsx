"use client"
import { Copy } from "@/components/lovable/copy"
import {
  SourceButton,
  SourceInput,
  SourceSelect,
  SourceOption,
  SourceLabel,
} from "@/components/ui/lovable-controls"

import { eur, PAGE } from "./history-shared"
import { useHistoryPageView } from "./history-HistoryPage-context"
import { HistoryPageSection2 } from "./history-HistoryPage-section-2"
export function HistoryPageSection1() {
  const {
    q,
    setQ,
    status,
    setStatus,
    channel,
    setChannel,
    payment,
    setPayment,
    from,
    setFrom,
    to,
    setTo,
    page,
    setPage,
    selected,
    filtered,
    pages,
    paid,
    revenue,
    reset,
    exportCsv,
    sel,
  } = useHistoryPageView()

  return (
    <div className="print:hidden">
      <section className="flex flex-wrap items-end justify-between gap-6 px-6 pt-8 pb-6">
        <div>
          <p className="label-mono text-muted-foreground">
            <Copy>Completed more than 24h ago</Copy>
          </p>

          <h1 className="mt-1 font-display text-4xl font-bold">
            <Copy>Order history</Copy>
          </h1>
        </div>

        <div className="grid grid-cols-3 border">
          <Copy>
            {[
              ["Orders", String(filtered.length)],
              ["Revenue", eur(revenue)],
              ["Avg basket", eur(paid.length ? revenue / paid.length : 0)],
            ].map(([k, v], i) => (
              <div key={k} className={`px-5 py-3 ${i ? "border-l" : ""}`}>
                <p className="label-mono text-muted-foreground">
                  <Copy>{k}</Copy>
                </p>

                <p className="font-display text-2xl font-bold">
                  <Copy>{v}</Copy>
                </p>
              </div>
            ))}
          </Copy>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2 px-6 pb-4">
        <SourceInput
          value={q}
          onChange={(e) => reset(() => setQ(e.target.value))}
          placeholder="Search order #, customer, email, dish, code…"
          className="w-80 border bg-background px-4 py-2.5 text-sm outline-none focus:shadow-[3px_3px_0_0_var(--color-primary)]"
        />

        <SourceSelect
          value={status}
          onChange={(e) =>
            reset(() => setStatus(e.target.value as typeof status))
          }
          className={sel}
          aria-label="Status"
        >
          <Copy>
            {["All", "Collected", "Refunded", "Cancelled"].map((x) => (
              <SourceOption key={x}>
                <Copy>{x}</Copy>
              </SourceOption>
            ))}
          </Copy>
        </SourceSelect>

        <SourceSelect
          value={channel}
          onChange={(e) => reset(() => setChannel(e.target.value))}
          className={sel}
          aria-label="Channel"
        >
          <Copy>
            {["All", "Web", "QR", "Phone"].map((x) => (
              <SourceOption key={x} value={x}>
                <Copy>{x === "All" ? "All channels" : x}</Copy>
              </SourceOption>
            ))}
          </Copy>
        </SourceSelect>

        <SourceSelect
          value={payment}
          onChange={(e) => reset(() => setPayment(e.target.value))}
          className={sel}
          aria-label="Payment"
        >
          <Copy>
            {["All", "Card", "Apple Pay", "Cash"].map((x) => (
              <SourceOption key={x} value={x}>
                <Copy>{x === "All" ? "All payments" : x}</Copy>
              </SourceOption>
            ))}
          </Copy>
        </SourceSelect>

        <SourceLabel className="label-mono flex items-center gap-1 text-muted-foreground">
          <Copy>From</Copy>

          <SourceInput
            type="date"
            value={from}
            onChange={(e) => reset(() => setFrom(e.target.value))}
            className={sel}
          />
        </SourceLabel>

        <SourceLabel className="label-mono flex items-center gap-1 text-muted-foreground">
          <Copy>To</Copy>

          <SourceInput
            type="date"
            value={to}
            onChange={(e) => reset(() => setTo(e.target.value))}
            className={sel}
          />
        </SourceLabel>

        <Copy>
          {(q ||
            status !== "All" ||
            channel !== "All" ||
            payment !== "All" ||
            from ||
            to) && (
            <SourceButton
              onClick={() =>
                reset(() => {
                  setQ("")
                  setStatus("All")
                  setChannel("All")
                  setPayment("All")
                  setFrom("")
                  setTo("")
                })
              }
              className="label-mono px-2 text-muted-foreground underline"
            >
              <Copy>Clear</Copy>
            </SourceButton>
          )}
        </Copy>

        <SourceButton
          onClick={exportCsv}
          className="btn-primary ml-auto py-2.5"
        >
          <Copy>Export CSV </Copy>

          <Copy>
            {selected.size ? `(${selected.size})` : `(${filtered.length})`}
          </Copy>
        </SourceButton>
      </div>

      <HistoryPageSection2 />

      <div className="flex items-center justify-between px-6 py-4">
        <span className="label-mono text-muted-foreground">
          <Copy>
            {filtered.length
              ? `${page * PAGE + 1}–${Math.min(filtered.length, (page + 1) * PAGE)} of ${filtered.length}`
              : "0 results"}
          </Copy>
        </span>

        <div className="flex items-center gap-1">
          <SourceButton
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="label-mono border px-3 py-2 disabled:opacity-30"
          >
            <Copy>← Prev</Copy>
          </SourceButton>

          <span className="label-mono px-3">
            <Copy>Page </Copy>
            <Copy>{page + 1}</Copy> / <Copy>{pages}</Copy>
          </span>

          <SourceButton
            disabled={page >= pages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="label-mono border px-3 py-2 disabled:opacity-30"
          >
            <Copy>Next →</Copy>
          </SourceButton>
        </div>
      </div>
    </div>
  )
}

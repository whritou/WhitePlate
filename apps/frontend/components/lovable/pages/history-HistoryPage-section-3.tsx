"use client"
import { Copy } from "@/components/lovable/copy"
import { SourceButton, SourceInput } from "@/components/ui/lovable-controls"

import { total, fmtDate, fmtTime, eur } from "./history-shared"
import { useHistoryPageView } from "./history-HistoryPage-context"
export function HistoryPageSection3() {
  const { selected, setSelected, setBill, rows, Th, allOnPage } =
    useHistoryPageView()

  return (
    <table className="w-full text-sm">
      <thead className="border-b bg-secondary">
        <tr>
          <th className="w-10 px-3">
            <SourceInput
              type="checkbox"
              checked={allOnPage}
              aria-label="Select page"
              onChange={() =>
                setSelected((s) => {
                  const n = new Set(s)

                  rows.forEach((r) =>
                    allOnPage ? n.delete(r.id) : n.add(r.id)
                  )

                  return n
                })
              }
            />
          </th>

          <Th k="id">
            <Copy>Order</Copy>
          </Th>

          <Th k="date">
            <Copy>Date</Copy>
          </Th>

          <Th k="customer">
            <Copy>Customer</Copy>
          </Th>

          <Th>
            <Copy>Items</Copy>
          </Th>

          <Th>
            <Copy>Channel</Copy>
          </Th>

          <Th>
            <Copy>Payment</Copy>
          </Th>

          <Th>
            <Copy>Status</Copy>
          </Th>

          <Th k="total" right>
            <Copy>Total</Copy>
          </Th>

          <Th right>
            <Copy>{""}</Copy>
          </Th>
        </tr>
      </thead>

      <tbody>
        <Copy>
          {rows.map((o) => (
            <tr
              key={o.id}
              className="border-b last:border-0 hover:bg-secondary/60"
            >
              <td className="px-3">
                <SourceInput
                  type="checkbox"
                  checked={selected.has(o.id)}
                  aria-label={`Select order ${o.id}`}
                  onChange={() =>
                    setSelected((s) => {
                      const n = new Set(s)

                      if (n.has(o.id)) n.delete(o.id)
                      else n.add(o.id)

                      return n
                    })
                  }
                />
              </td>

              <td className="px-3 py-3 font-display font-bold">
                #<Copy>{o.id}</Copy>
              </td>

              <td className="px-3 py-3 whitespace-nowrap">
                <Copy>{fmtDate(o.date)}</Copy>{" "}
                <span className="text-muted-foreground">
                  <Copy>{fmtTime(o.date)}</Copy>
                </span>
              </td>

              <td className="px-3 py-3">
                <p className="font-semibold">
                  <Copy>{o.customer}</Copy>
                </p>

                <p className="text-xs text-muted-foreground">
                  <Copy>{o.email}</Copy>
                </p>
              </td>

              <td className="max-w-[260px] truncate px-3 py-3 text-muted-foreground">
                <Copy>{o.items.map((i) => `${i.q}× ${i.n}`).join(", ")}</Copy>
              </td>

              <td className="px-3 py-3">
                <span className="label-mono border px-1.5 py-0.5">
                  <Copy>{o.channel}</Copy>
                </span>
              </td>

              <td className="px-3 py-3">
                <Copy>{o.payment}</Copy>
              </td>

              <td className="px-3 py-3">
                <span
                  className={`label-mono px-2 py-0.5 ${o.status === "Collected" ? "bg-accent" : o.status === "Refunded" ? "border text-destructive" : "border text-muted-foreground"}`}
                >
                  <Copy>{o.status}</Copy>
                </span>
              </td>

              <td className="px-3 py-3 text-right font-display font-bold whitespace-nowrap">
                <Copy>
                  {eur(total(o))}

                  <Copy></Copy>

                  {o.code && (
                    <p className="label-mono text-primary">
                      <Copy>{o.code}</Copy>
                    </p>
                  )}
                </Copy>
              </td>

              <td className="px-3 py-3 text-right">
                <SourceButton
                  onClick={() => setBill(o)}
                  className="label-mono border px-2 py-1 hover:bg-foreground hover:text-background"
                >
                  <Copy>Bill</Copy>
                </SourceButton>
              </td>
            </tr>
          ))}
        </Copy>

        <Copy>
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={10}
                className="label-mono p-10 text-center text-muted-foreground"
              >
                <Copy>No orders match your filters</Copy>
              </td>
            </tr>
          )}
        </Copy>
      </tbody>
    </table>
  )
}

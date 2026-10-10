"use client"
import { Copy } from "@/components/lovable/copy"
import { SourceButton } from "@/components/ui/lovable-controls"
import type { Status, Order, SortKey } from "@/types/lovable/page-history"
import { useMemo, useState } from "react"
import {
  makeOrders,
  subtotal,
  total,
  vat,
  fmtTime,
  PAGE,
} from "./history-shared"
export function useHistoryPageModel() {
  const orders = useMemo(() => makeOrders(), [])
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<"All" | Status>("All")
  const [channel, setChannel] = useState("All")
  const [payment, setPayment] = useState("All")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [sort, setSort] = useState<{ k: SortKey; dir: 1 | -1 }>({
    k: "date",
    dir: -1,
  })
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bill, setBill] = useState<Order | null>(null)
  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim()
    const list = orders.filter(
      (o) =>
        (!s ||
          [o.id, o.customer, o.email, o.code ?? "", ...o.items.map((i) => i.n)]
            .join(" ")
            .toLowerCase()
            .includes(s)) &&
        (status === "All" || o.status === status) &&
        (channel === "All" || o.channel === channel) &&
        (payment === "All" || o.payment === payment) &&
        (!from || o.date >= new Date(from)) &&
        (!to || o.date <= new Date(to + "T23:59:59"))
    )
    const val = (o: Order) =>
      sort.k === "date"
        ? o.date.getTime()
        : sort.k === "total"
          ? total(o)
          : sort.k === "id"
            ? +o.id
            : o.customer

    return list.sort((a, b) => (val(a) > val(b) ? 1 : -1) * sort.dir)
  }, [orders, q, status, channel, payment, from, to, sort])
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const rows = filtered.slice(page * PAGE, page * PAGE + PAGE)
  const paid = filtered.filter((o) => o.status === "Collected")
  const revenue = paid.reduce((s, o) => s + total(o), 0)
  const reset = (fn: () => void) => {
    fn()
    setPage(0)
  }

  const exportCsv = () => {
    const src = selected.size
      ? filtered.filter((o) => selected.has(o.id))
      : filtered
    const head = [
      "Order",
      "Date",
      "Time",
      "Customer",
      "Email",
      "Channel",
      "Payment",
      "Status",
      "Items",
      "Subtotal",
      "Discount",
      "Code",
      "VAT",
      "Total",
    ]
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
    const lines = src.map((o) =>
      [
        o.id,
        o.date.toISOString().slice(0, 10),
        fmtTime(o.date),
        o.customer,
        o.email,
        o.channel,
        o.payment,
        o.status,
        o.items.map((i) => `${i.q}x ${i.n}`).join(" | "),
        subtotal(o).toFixed(2),
        o.discount.toFixed(2),
        o.code ?? "",
        vat(o).toFixed(2),
        total(o).toFixed(2),
      ]
        .map(esc)
        .join(",")
    )
    const blob = new Blob([[head.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    })
    const a = document.createElement("a")

    a.href = URL.createObjectURL(blob)
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const Th = ({
    k,
    children,
    right,
  }: {
    k?: SortKey
    children: React.ReactNode
    right?: boolean
  }) => (
    <th
      className={`label-mono px-3 py-3 text-muted-foreground ${right ? "text-right" : "text-left"}`}
    >
      <Copy>
        {k ? (
          <SourceButton
            onClick={() =>
              setSort((s) => ({
                k,
                dir: s.k === k ? (s.dir === 1 ? -1 : 1) : -1,
              }))
            }
            className="hover:text-foreground"
          >
            <Copy>{children}</Copy>{" "}
            <Copy>{sort.k === k ? (sort.dir === 1 ? "↑" : "↓") : ""}</Copy>
          </SourceButton>
        ) : (
          children
        )}
      </Copy>
    </th>
  )
  const sel = "label-mono border bg-background px-3 py-2.5"
  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id))

  return {
    orders,
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
    sort,
    setSort,
    page,
    setPage,
    selected,
    setSelected,
    bill,
    setBill,
    filtered,
    pages,
    rows,
    paid,
    revenue,
    reset,
    exportCsv,
    Th,
    sel,
    allOnPage,
  }
}

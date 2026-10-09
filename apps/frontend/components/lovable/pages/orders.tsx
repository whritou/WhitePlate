"use client"
import { Copy } from "@/components/lovable/copy"
import { SourceButton, SourceInput } from "@/components/ui/lovable-controls"
import {
  useBackoffice,
  type Order,
  type Status,
} from "@/lib/lovable/backoffice"
import { useEffect, useMemo, useState } from "react"

const COLUMNS: { id: Status; title: string; hint: string; tone: string }[] = [
  {
    id: "new",
    title: "New",
    hint: "Accept to send to kitchen",
    tone: "bg-accent",
  },
  {
    id: "preparing",
    title: "Preparing",
    hint: "On the line",
    tone: "bg-primary",
  },
  {
    id: "ready",
    title: "Ready",
    hint: "Waiting at the counter",
    tone: "bg-foreground",
  },
  {
    id: "collected",
    title: "Collected",
    hint: "Last 60 minutes",
    tone: "bg-muted-foreground",
  },
]
const NEXT: Record<Status, Status | null> = {
  new: "preparing",
  preparing: "ready",
  ready: "collected",
  collected: null,
}
const ACTION: Record<Status, string> = {
  new: "Accept",
  preparing: "Mark ready",
  ready: "Collected",
  collected: "",
}

export function OrdersPage() {
  const { orders, setOrders, paused, setPaused } = useBackoffice()
  const [dragId, setDragId] = useState<string | null>(null)
  const [over, setOver] = useState<Status | null>(null)
  const [query, setQuery] = useState("")
  const [now, setNow] = useState("")

  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      )

    tick()

    const t = setInterval(tick, 30000)

    return () => clearInterval(t)
  }, [])

  const move = (id: string, status: Status) =>
    setOrders((o) => o.map((x) => (x.id === id ? { ...x, status } : x)))

  const filtered = useMemo(
    () =>
      orders.filter((o) =>
        (o.customer + o.id + o.items.map((i) => i.n).join(" "))
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [orders, query]
  )

  const revenue = orders.reduce((s, o) => s + o.total, 0)
  const active = orders.filter((o) => o.status !== "collected").length

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}

      {/* Toolbar + KPIs */}

      <section className="flex flex-wrap items-end justify-between gap-6 px-6 pt-8 pb-6">
        <div>
          <p className="label-mono text-muted-foreground">
            <Copy>Demo service · </Copy>

            <Copy>{now}</Copy>
          </p>

          <h1 className="mt-1 font-display text-4xl font-bold">
            <Copy>Order board</Copy>
          </h1>
        </div>

        <div className="grid grid-cols-3 border">
          <Copy>
            {[
              ["Active", String(active)],
              ["Avg prep", "11 min"],
              ["Today", `€${revenue.toFixed(0)}`],
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

      <div className="flex flex-wrap items-center gap-3 px-6 pb-6">
        <SourceInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search order, customer, dish…"
          className="w-72 border bg-background px-4 py-2.5 text-sm outline-none focus:shadow-[3px_3px_0_0_var(--color-primary)]"
        />

        <Copy>
          {["All", "Web", "QR", "Phone"].map((c, i) => (
            <span
              key={c}
              className={`label-mono border px-3 py-2 ${i === 0 ? "bg-accent" : ""}`}
            >
              <Copy>{c}</Copy>
            </span>
          ))}
        </Copy>

        <SourceButton
          onClick={() => setPaused((p) => !p)}
          className={`ml-auto ${paused ? "btn-primary" : "btn-ghost"}`}
        >
          <span
            className={`h-2 w-2 ${paused ? "bg-destructive" : "animate-pulse bg-primary"}`}
          />

          <Copy>{paused ? "Orders paused" : "Accepting orders"}</Copy>
        </SourceButton>
      </div>

      {/* Board */}

      <main className="grid gap-4 px-6 pb-12 md:grid-cols-2 xl:grid-cols-4">
        <Copy>
          {COLUMNS.map((col) => {
            const list = filtered.filter((o) => o.status === col.id)

            return (
              <section
                key={col.id}
                onDragOver={(e) => {
                  e.preventDefault()
                  setOver(col.id)
                }}
                onDragLeave={() => setOver(null)}
                onDrop={() => {
                  if (dragId) move(dragId, col.id)
                  setDragId(null)
                  setOver(null)
                }}
                className={`flex min-h-[60vh] flex-col border bg-secondary transition-shadow ${over === col.id ? "shadow-[5px_5px_0_0_var(--color-primary)]" : ""}`}
              >
                <div className="flex items-center justify-between border-b bg-background px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-3 w-3 ${col.tone}`} />

                    <h2 className="font-display text-lg font-bold">
                      <Copy>{col.title}</Copy>
                    </h2>

                    <span className="label-mono border px-1.5">
                      <Copy>{list.length}</Copy>
                    </span>
                  </div>

                  <span className="label-mono text-muted-foreground">
                    <Copy>{col.hint}</Copy>
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-3 p-3">
                  <Copy>
                    {list.map((o) => (
                      <OrderCard
                        key={o.id}
                        o={o}
                        dragging={dragId === o.id}
                        onDrag={setDragId}
                        onAdvance={() => {
                          const next = NEXT[o.status]

                          if (next) move(o.id, next)
                        }}
                      />
                    ))}
                  </Copy>

                  <Copy>
                    {list.length === 0 && (
                      <div className="label-mono flex flex-1 items-center justify-center border border-dashed text-muted-foreground">
                        <Copy>Drop orders here</Copy>
                      </div>
                    )}
                  </Copy>
                </div>
              </section>
            )
          })}
        </Copy>
      </main>
    </div>
  )
}

function OrderCard({
  o,
  dragging,
  onDrag,
  onAdvance,
}: {
  o: Order
  dragging: boolean
  onDrag: (id: string | null) => void
  onAdvance: () => void
}) {
  const late = o.status !== "collected" && o.placedMin > 12

  return (
    <article
      draggable
      onDragStart={() => onDrag(o.id)}
      onDragEnd={() => onDrag(null)}
      className={`card-hard cursor-grab bg-background active:cursor-grabbing ${dragging ? "opacity-40" : ""} ${o.status === "collected" ? "opacity-60" : ""}`}
    >
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <span className="font-display text-lg font-bold">
          #<Copy>{o.id}</Copy>
        </span>

        <span
          className={`label-mono px-2 py-0.5 ${late ? "bg-destructive text-primary-foreground" : "bg-accent"}`}
        >
          <Copy>
            {late ? `${o.placedMin} min · late` : `${o.placedMin} min`}
          </Copy>
        </span>
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="font-semibold">
            <Copy>{o.customer}</Copy>
          </p>

          <p className="label-mono text-muted-foreground">
            <Copy>Pickup </Copy>

            <Copy>{o.pickup}</Copy>
          </p>
        </div>

        <ul className="mt-3 space-y-1.5 text-sm">
          <Copy>
            {o.items.map((i, k) => (
              <li key={k}>
                <span className="font-bold">
                  <Copy>{i.q}</Copy>×
                </span>{" "}
                <Copy>{i.n}</Copy>
                <Copy>
                  {i.note && (
                    <span className="ml-1 bg-secondary px-1 text-xs text-muted-foreground">
                      <Copy>{i.note}</Copy>
                    </span>
                  )}
                </Copy>
              </li>
            ))}
          </Copy>
        </ul>
      </div>

      <div className="flex items-center justify-between border-t px-4 py-2.5">
        <div className="flex gap-2">
          <span className="label-mono border px-1.5">
            <Copy>{o.channel}</Copy>
          </span>

          <span
            className={`label-mono px-1.5 ${o.paid ? "text-primary" : "text-destructive"}`}
          >
            <Copy>{o.paid ? "Paid" : "Pay at pickup"}</Copy>
          </span>
        </div>

        <span className="font-display font-bold">
          €<Copy>{o.total.toFixed(2)}</Copy>
        </span>
      </div>

      <Copy>
        {ACTION[o.status] && (
          <SourceButton
            onClick={onAdvance}
            className="label-mono w-full border-t bg-foreground py-2.5 text-background transition-colors hover:bg-primary"
          >
            <Copy>{ACTION[o.status]}</Copy> →
          </SourceButton>
        )}
      </Copy>
    </article>
  )
}

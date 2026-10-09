"use client"
import { SourceModal } from "@/components/ui/lovable-modal"
import { Copy } from "@/components/lovable/copy"
import { SourceButton } from "@/components/ui/lovable-controls"
import type { Item, Order } from "@/types/lovable/page-history"
export type { Status, Item, Order, SortKey } from "@/types/lovable/page-history"
export const DISHES: [string, number][] = [
  ["Burger Maison", 17],
  ["Green bowl", 14],
  ["Roast chicken", 19],
  ["Wild mushroom risotto", 16],
  ["Burrata & heirloom tomato", 11],
  ["Crispy courgette flowers", 9],
  ["Tiramisu", 7],
  ["Lemon tart", 7],
  ["Lemonade", 4],
]
export const NAMES = [
  "Léa Martin",
  "Tom Roux",
  "Sarah Klein",
  "Hugo Bernard",
  "Inès Dubois",
  "Marc Petit",
  "Julie Vidal",
  "Ali Saïdi",
  "Emma Leroy",
  "Noah Garcia",
  "Chloé Moreau",
  "Lucas Fontaine",
]
export function seeded(n: number) {
  let s = n

  return () => (s = (s * 9301 + 49297) % 233280) / 233280
}

export function makeOrders(): Order[] {
  const rnd = seeded(42)
  const out: Order[] = []
  const base = new Date()

  base.setHours(base.getHours() - 25, 0, 0, 0)
  for (let i = 0; i < 140; i++) {
    const date = new Date(
      base.getTime() - Math.floor(rnd() * 60 * 24 * 3600 * 1000)
    )

    date.setHours(
      rnd() < 0.5 ? 12 + Math.floor(rnd() * 2) : 19 + Math.floor(rnd() * 3),
      Math.floor(rnd() * 60)
    )

    const items: Item[] = Array.from(
      { length: 1 + Math.floor(rnd() * 3) },
      () => {
        const [n, p] = DISHES[Math.floor(rnd() * DISHES.length)]!

        return {
          q: 1 + Math.floor(rnd() * 2),
          n,
          p,
          tax: n === "Lemonade" ? 5.5 : 10,
        }
      }
    )
    const sub = items.reduce((s, x) => s + x.q * x.p, 0)
    const hasCode = rnd() < 0.15
    const name = NAMES[Math.floor(rnd() * NAMES.length)]!
    const r = rnd()

    out.push({
      id: String(1000 - i),
      date,
      customer: name,
      email:
        name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[^a-z ]/g, "")
          .replace(" ", ".") + "@mail.com",
      channel: (["Web", "Web", "QR", "Phone"] as const)[Math.floor(rnd() * 4)]!,
      payment: (["Card", "Card", "Apple Pay", "Cash"] as const)[
        Math.floor(rnd() * 4)
      ]!,
      status: r < 0.9 ? "Collected" : r < 0.95 ? "Refunded" : "Cancelled",
      items,
      discount: hasCode ? +(sub * 0.1).toFixed(2) : 0,
      ...(hasCode ? { code: "WELCOME10" } : {}),
    })
  }

  out.sort((a, b) => b.date.getTime() - a.date.getTime())
  out.forEach((o, i) => (o.id = String(1140 - i)))

  return out
}

export const subtotal = (o: Order) => o.items.reduce((s, x) => s + x.q * x.p, 0)
export const total = (o: Order) => subtotal(o) - o.discount
export const vat = (o: Order) =>
  o.items.reduce(
    (s, x) =>
      s + x.q * x.p * (1 - o.discount / subtotal(o)) * (x.tax / (100 + x.tax)),
    0
  )
export const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
export const fmtTime = (d: Date) =>
  d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
export const eur = (n: number) => `€${n.toFixed(2)}`
export const PAGE = 15
export function Bill({ o, onClose }: { o: Order; onClose: () => void }) {
  const taxes = [...new Set(o.items.map((i) => i.tax))].map((rate) => {
    const gross =
      o.items.filter((i) => i.tax === rate).reduce((s, i) => s + i.q * i.p, 0) *
      (1 - o.discount / subtotal(o))

    return {
      rate,
      base: gross / (1 + rate / 100),
      tax: gross - gross / (1 + rate / 100),
    }
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/50 p-6 print:static print:bg-transparent print:p-0"
      onClick={onClose}
    >
      <SourceModal
        label="Receipt"
        onClose={() => onClose()}
        onClick={(e) => e.stopPropagation()}
        className="card-hard w-full max-w-md bg-background print:max-w-none print:border-0 print:shadow-none"
      >
        <div className="flex items-center justify-between border-b px-5 py-3 print:hidden">
          <p className="label-mono text-muted-foreground">
            <Copy>Receipt</Copy>
          </p>

          <div className="flex gap-2">
            <SourceButton
              onClick={() => window.print()}
              className="btn-primary py-1.5"
            >
              <Copy>Print / PDF</Copy>
            </SourceButton>

            <SourceButton onClick={onClose} aria-label="Close" className="px-2">
              ✕
            </SourceButton>
          </div>
        </div>

        <div className="space-y-4 p-6 text-sm">
          <div className="text-center">
            <p className="font-display text-2xl font-bold">
              <Copy>Maison Verte</Copy>
            </p>

            <p className="text-muted-foreground">
              <Copy>12 rue de la Roquette, 75011 Paris</Copy>
            </p>

            <p className="text-muted-foreground">
              <Copy>SIRET 123 456 789 00012 · VAT FR12 345678901</Copy>
            </p>
          </div>

          <div className="flex justify-between border-y border-dashed py-2">
            <span>
              <b>
                <Copy>Order #</Copy>

                <Copy>{o.id}</Copy>
              </b>

              <br />

              <Copy>{o.customer}</Copy>
            </span>

            <span className="text-right">
              <Copy>{fmtDate(o.date)}</Copy>
              <br />
              <Copy>{fmtTime(o.date)}</Copy> · <Copy>{o.channel}</Copy>
            </span>
          </div>

          <table className="w-full">
            <tbody>
              <Copy>
                {o.items.map((i, k) => (
                  <tr key={k}>
                    <td className="py-1">
                      <Copy>{i.q}</Copy>× <Copy>{i.n}</Copy>
                    </td>

                    <td className="text-right text-muted-foreground">
                      <Copy>{eur(i.p)}</Copy>
                    </td>

                    <td className="w-20 text-right">
                      <Copy>{eur(i.q * i.p)}</Copy>
                    </td>
                  </tr>
                ))}
              </Copy>
            </tbody>
          </table>

          <div className="space-y-1 border-t border-dashed pt-2">
            <div className="flex justify-between">
              <span>
                <Copy>Subtotal</Copy>
              </span>

              <span>
                <Copy>{eur(subtotal(o))}</Copy>
              </span>
            </div>

            <Copy>
              {o.discount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>
                    <Copy>Discount </Copy>

                    <Copy>{o.code}</Copy>
                  </span>

                  <span>
                    −<Copy>{eur(o.discount)}</Copy>
                  </span>
                </div>
              )}
            </Copy>

            <div className="flex justify-between font-display text-xl font-bold">
              <span>
                <Copy>Total incl. VAT</Copy>
              </span>

              <span>
                <Copy>{eur(total(o))}</Copy>
              </span>
            </div>
          </div>

          <table className="w-full text-xs text-muted-foreground">
            <thead>
              <tr className="label-mono">
                <th className="text-left">
                  <Copy>VAT</Copy>
                </th>

                <th className="text-right">
                  <Copy>Excl. VAT</Copy>
                </th>

                <th className="text-right">
                  <Copy>VAT</Copy>
                </th>
              </tr>
            </thead>

            <tbody>
              <Copy>
                {taxes.map((t) => (
                  <tr key={t.rate}>
                    <td>
                      <Copy>{t.rate}</Copy>%
                    </td>

                    <td className="text-right">
                      <Copy>{eur(t.base)}</Copy>
                    </td>

                    <td className="text-right">
                      <Copy>{eur(t.tax)}</Copy>
                    </td>
                  </tr>
                ))}
              </Copy>
            </tbody>
          </table>

          <div className="flex justify-between border-t border-dashed pt-2">
            <span>
              <Copy>Paid by </Copy>

              <Copy>{o.payment}</Copy>
            </span>

            <span
              className={
                o.status === "Collected" ? "" : "font-bold text-destructive"
              }
            >
              <Copy>{o.status}</Copy>
            </span>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            <Copy>Thank you! · Powered by WhitePlate</Copy>
          </p>
        </div>
      </SourceModal>
    </div>
  )
}

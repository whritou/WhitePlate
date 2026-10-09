"use client"
import { SourceModal } from "@/components/ui/lovable-modal"
import { Copy } from "@/components/lovable/copy"
import { SourceButton } from "@/components/ui/lovable-controls"
import { useState } from "react"
import { type StoreTheme } from "@/lib/lovable/storeTheme"
import {
  tx,
  type MenuData,
  type Option,
  type Product,
} from "@/lib/lovable/menu"
export const UI: Record<string, Record<string, string>> = {
  en: {
    basket: "Basket",
    all: "All",
    address: "Address",
    hours: "Hours",
    phone: "Phone",
    open: "Open now · pickup in",
    view: "View basket",
    items: "items",
    your: "Your basket",
    empty: "Your basket is empty.",
    pickup: "Pickup",
    total: "Total",
    subtotal: "Subtotal",
    discount: "Discount",
    place: "Place order",
    code: "Discount code",
    apply: "Apply",
    placed: "Order placed!",
    pickAt: "Pick it up at",
    inAbout: "in about",
    back: "Back to menu",
    required: "Required · pick 1",
    optional: "Optional",
    add: "Add",
    allergens: "Allergens",
    none: "No listed allergens",
  },
  fr: {
    basket: "Panier",
    all: "Tout",
    address: "Adresse",
    hours: "Horaires",
    phone: "Téléphone",
    open: "Ouvert · retrait en",
    view: "Voir le panier",
    items: "articles",
    your: "Votre panier",
    empty: "Votre panier est vide.",
    pickup: "Retrait",
    total: "Total",
    subtotal: "Sous-total",
    discount: "Réduction",
    place: "Commander",
    code: "Code promo",
    apply: "Appliquer",
    placed: "Commande envoyée !",
    pickAt: "À récupérer au",
    inAbout: "dans environ",
    back: "Retour au menu",
    required: "Obligatoire · 1 choix",
    optional: "Facultatif",
    add: "Ajouter",
    allergens: "Allergènes",
    none: "Aucun allergène déclaré",
  },
}
export function ProductModal({
  p,
  t,
  r,
  line,
  muted,
  lang,
  u,
  menu,
  onClose,
  onAdd,
}: {
  p: Product
  t: StoreTheme
  r: string
  line: string
  muted: string
  lang: string
  u: (k: string) => string
  menu: MenuData
  onClose: () => void
  onAdd: (picks: string[], unit: number, qty: number) => void
}) {
  const [sel, setSel] = useState<Record<number, number[]>>(() =>
    Object.fromEntries(
      p.options.map((o, i) => [
        i,
        o.type === "one" && o.choices.length ? [0] : [],
      ])
    )
  )
  const [qty, setQty] = useState(1)
  const [img, setImg] = useState(0)
  const extra = p.options.reduce(
    (s, o, gi) =>
      s +
      o.choices
        .filter((_, ci) => sel[gi]?.includes(ci))
        .reduce((a, c) => a + c.p, 0),
    0
  )
  const unit = p.p + extra
  const toggle = (o: Option, gi: number, ci: number) =>
    setSel((s) => {
      const cur = s[gi] ?? []

      return {
        ...s,
        [gi]:
          o.type === "one"
            ? [ci]
            : cur.includes(ci)
              ? cur.filter((x) => x !== ci)
              : [...cur, ci],
      }
    })
  const allergens = (p.allergens ?? [])
    .map((id) => menu.allergens.find((a) => a.id === id))
    .filter(Boolean)

  return (
    <div
      className="absolute inset-0 z-40 flex items-start justify-center p-4 pt-16"
      style={{ background: "rgba(0,0,0,.5)" }}
      onClick={onClose}
    >
      <SourceModal
        label="Product details"
        onClose={() => onClose()}
        onClick={(e) => e.stopPropagation()}
        className="sticky top-16 w-full max-w-md overflow-hidden"
        style={{ background: t.bg, borderRadius: r }}
      >
        <div className="relative">
          {p.images[img] ? (
            <img
              src={p.images[img]}
              alt={tx(p, "n", lang)}
              className="aspect-[16/10] w-full object-cover"
            />
          ) : (
            <div className="aspect-[16/10]" style={{ background: line }} />
          )}

          <SourceButton
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 h-9 w-9 font-bold"
            style={{ background: t.bg, color: t.text, borderRadius: r }}
          >
            ✕
          </SourceButton>

          <Copy>
            {p.images.length > 1 && (
              <div className="absolute bottom-3 left-3 flex gap-1.5">
                <Copy>
                  {p.images.map((src, i) => (
                    <SourceButton
                      key={i}
                      onClick={() => setImg(i)}
                      className="h-10 w-10 overflow-hidden"
                      style={{
                        borderRadius: r,
                        outline: i === img ? `2px solid ${t.accent}` : "none",
                      }}
                    >
                      <img
                        src={src}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </SourceButton>
                  ))}
                </Copy>
              </div>
            )}
          </Copy>
        </div>

        <div className="max-h-[45vh] space-y-5 overflow-y-auto p-5">
          <div>
            <h3 className="text-2xl font-bold">{tx(p, "n", lang)}</h3>

            <p style={{ color: muted }}>{tx(p, "d", lang)}</p>

            <p className="mt-1 font-bold" style={{ color: t.primary }}>
              €<Copy>{p.p.toFixed(2)}</Copy>
            </p>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-bold">
              <Copy>{u("allergens")}</Copy>
            </p>

            {allergens.length ? (
              <div className="flex flex-wrap gap-1.5">
                <Copy>
                  {allergens.map((a) => (
                    <span
                      key={a!.id}
                      className="px-2 py-0.5 text-xs font-semibold"
                      style={{ border: `1px solid ${line}`, borderRadius: r }}
                    >
                      <Copy>{a!.icon}</Copy> {tx(a!, "name", lang)}
                    </span>
                  ))}
                </Copy>
              </div>
            ) : (
              <p className="text-sm" style={{ color: muted }}>
                <Copy>{u("none")}</Copy>
              </p>
            )}
          </div>

          {p.options.map((o, gi) => (
            <div key={gi}>
              <p className="mb-2 flex justify-between text-sm font-bold">
                {tx(o, "group", lang)}

                <span style={{ color: muted }}>
                  <Copy>
                    {o.type === "one" ? u("required") : u("optional")}
                  </Copy>
                </span>
              </p>

              <div className="space-y-1.5">
                <Copy>
                  {o.choices.map((c, ci) => {
                    const on = sel[gi]?.includes(ci)

                    return (
                      <SourceButton
                        key={ci}
                        onClick={() => toggle(o, gi, ci)}
                        className="flex w-full items-center justify-between px-3 py-2.5 text-sm"
                        style={{
                          border: `1px solid ${on ? t.primary : line}`,
                          borderRadius: r,
                          background: on
                            ? `color-mix(in oklab, ${t.primary} 10%, transparent)`
                            : "transparent",
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="flex h-4 w-4 items-center justify-center text-[10px]"
                            style={{
                              border: `1.5px solid ${on ? t.primary : muted}`,
                              borderRadius: o.type === "one" ? "50%" : "3px",
                              background: on ? t.primary : "transparent",
                              color: t.bg,
                            }}
                          >
                            <Copy>{on ? "✓" : ""}</Copy>
                          </span>

                          {tx(c, "n", lang)}
                        </span>

                        <Copy>
                          {c.p > 0 && (
                            <span style={{ color: muted }}>
                              +€<Copy>{c.p.toFixed(2)}</Copy>
                            </span>
                          )}
                        </Copy>
                      </SourceButton>
                    )
                  })}
                </Copy>
              </div>
            </div>
          ))}
        </div>

        <div
          className="flex items-center gap-3 p-5"
          style={{ borderTop: `1px solid ${line}` }}
        >
          <div
            className="flex h-11 items-center"
            style={{ border: `1px solid ${line}`, borderRadius: r }}
          >
            <SourceButton
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-10 text-lg font-bold"
            >
              −
            </SourceButton>

            <span className="w-6 text-center font-bold">
              <Copy>{qty}</Copy>
            </span>

            <SourceButton
              onClick={() => setQty((q) => q + 1)}
              className="w-10 text-lg font-bold"
            >
              +
            </SourceButton>
          </div>

          <SourceButton
            onClick={() =>
              onAdd(
                p.options.flatMap((o, gi) =>
                  (sel[gi] ?? []).map((ci) => tx(o.choices[ci]!, "n", lang))
                ),
                unit,
                qty
              )
            }
            className="h-11 flex-1 font-bold"
            style={{ background: t.primary, color: t.bg, borderRadius: r }}
          >
            <Copy>{u("add")}</Copy> <Copy>{qty}</Copy> · €
            <Copy>{(unit * qty).toFixed(2)}</Copy>
          </SourceButton>
        </div>
      </SourceModal>
    </div>
  )
}

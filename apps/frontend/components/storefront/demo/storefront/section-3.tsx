"use client"
import { Copy } from "@/components/shared/translated-copy"
import { SourceButton } from "@/components/ui/lovable-controls"
import { tx } from "@/lib/lovable/menu"
import { useStorefrontView } from "./context"
export function StorefrontSection3() {
  const {
    t,
    lang,
    cat,
    setOpen,
    MENU,
    allergen,
    r,
    muted,
    line,
    qtyOf,
    quickRemove,
    quickAdd,
    btn,
    money,
    cartLoaded,
    binding,
  } = useStorefrontView()

  return (
    <>
      {MENU.filter((m) => cat === "all" || m.id === cat).map((m) => (
        <section key={m.id} className="mt-4">
          <h2 className="mb-3 text-lg font-bold">{tx(m, "cat", lang)}</h2>

          <div
            className={`customer-products ${t.layout === "grid" ? "customer-product-grid grid" : "flex flex-col"}`}
          >
            {m.items.map((i) => {
              const q = qtyOf(i.id)

              return (
                <article
                  key={i.id}
                  className={`customer-product-card relative isolate min-w-0 overflow-hidden ${t.layout === "list" ? "customer-product-list flex" : ""}`}
                  style={{ border: `1px solid ${line}`, borderRadius: r }}
                >
                  <SourceButton
                    onClick={() => setOpen(i)}
                    disabled={!cartLoaded || binding?.locked}
                    aria-label={tx(i, "n", lang)}
                    className="customer-product-card-trigger absolute -inset-px z-0 h-auto min-h-0 w-auto max-w-none min-w-0"
                  />

                  <div
                    aria-hidden="true"
                    className={`customer-product-image pointer-events-none relative z-10 block shrink-0 ${t.layout === "list" ? "w-28 sm:w-32" : "customer-image-ratio w-full"}`}
                  >
                    <Copy>
                      {i.images[0] ? (
                        <img
                          src={i.images[0]}
                          alt={tx(i, "n", lang)}
                          loading="lazy"
                          className={`w-full object-cover ${t.layout === "list" ? "h-full" : "aspect-[4/3]"}`}
                        />
                      ) : (
                        <div
                          className={`w-full ${t.layout === "list" ? "h-full" : "aspect-[4/3]"}`}
                          style={{ background: line }}
                        />
                      )}
                    </Copy>

                    <Copy>
                      {i.tag && (
                        <span
                          className="absolute top-2 left-2 px-2 py-0.5 text-xs font-bold"
                          style={btn}
                        >
                          <Copy>{i.tag}</Copy>
                        </span>
                      )}
                    </Copy>

                    <Copy>
                      {i.images.length > 1 && (
                        <span
                          className="absolute right-2 bottom-2 px-1.5 text-xs font-bold"
                          style={{
                            background: t.bg,
                            color: t.text,
                            borderRadius: r,
                          }}
                        >
                          +<Copy>{i.images.length - 1}</Copy>
                        </span>
                      )}
                    </Copy>
                  </div>

                  <div className="customer-product-details pointer-events-none relative z-10 flex min-w-0 flex-1 flex-wrap items-end justify-between gap-3">
                    <div className="min-w-0 flex-1 basis-44 text-left [overflow-wrap:anywhere]">
                      <p className="font-bold">{tx(i, "n", lang)}</p>

                      <p className="text-sm" style={{ color: muted }}>
                        {tx(i, "d", lang)}
                      </p>

                      <Copy>
                        {(i.allergens?.length ?? 0) > 0 && (
                          <p
                            className="mt-1 text-sm"
                            title={i
                              .allergens!.map(
                                (a) =>
                                  allergen(a) && tx(allergen(a)!, "name", lang)
                              )
                              .join(", ")}
                          >
                            <Copy>
                              {i
                                .allergens!.map((a) => allergen(a)?.icon)
                                .join(" ")}
                            </Copy>
                          </p>
                        )}
                      </Copy>

                      <p
                        className="mt-1 font-bold"
                        style={{ color: t.primary }}
                      >
                        <Copy>{money(i.p)}</Copy>
                      </p>
                    </div>

                    <div className="pointer-events-auto relative z-10">
                      {q === 0 ? (
                        <SourceButton
                          onClick={() => quickAdd(i)}
                          disabled={!cartLoaded || binding?.locked}
                          aria-label={`Add ${i.n}`}
                          className="h-9 w-9 shrink-0 text-lg font-bold"
                          style={btn}
                        >
                          +
                        </SourceButton>
                      ) : (
                        <div
                          className="customer-quantity-control flex shrink-0 items-center overflow-hidden"
                          style={{
                            ...btn,
                            borderRadius: "var(--customer-button-radius)",
                            overflow: "hidden",
                          }}
                        >
                          <SourceButton
                            onClick={() => quickRemove(i.id)}
                            aria-label="Remove one"
                            className="h-9 w-9 text-lg font-bold"
                          >
                            −
                          </SourceButton>

                          <span className="w-6 text-center font-bold">
                            <Copy>{q}</Copy>
                          </span>

                          <SourceButton
                            onClick={() => quickAdd(i)}
                            aria-label="Add one"
                            className="h-9 w-9 text-lg font-bold"
                          >
                            +
                          </SourceButton>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ))}
    </>
  )
}

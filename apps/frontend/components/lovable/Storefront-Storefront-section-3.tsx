"use client"
import { Copy } from "@/components/lovable/copy"
import { SourceButton } from "@/components/ui/lovable-controls"
import { tx } from "@/lib/lovable/menu"
import { useStorefrontView } from "./Storefront-Storefront-context"
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
  } = useStorefrontView()

  return (
    <>
      {MENU.filter((m) => cat === "all" || m.id === cat).map((m) => (
        <section key={m.id} className="mt-4">
          <h2 className="mb-3 text-lg font-bold">{tx(m, "cat", lang)}</h2>

          <div
            className={`customer-products ${t.layout === "grid" ? "grid sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col"}`}
          >
            {m.items.map((i) => {
              const q = qtyOf(i.id)

              return (
                <article
                  key={i.id}
                  className={`overflow-hidden ${t.layout === "list" ? "flex" : ""}`}
                  style={{ border: `1px solid ${line}`, borderRadius: r }}
                >
                  <SourceButton
                    onClick={() => setOpen(i)}
                    className={`customer-product-image relative block shrink-0 ${t.layout === "list" ? "w-28 sm:w-32" : "customer-image-ratio w-full"}`}
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
                  </SourceButton>

                  <div className="customer-product-details flex min-w-0 flex-1 items-end justify-between gap-3">
                    <SourceButton
                      onClick={() => setOpen(i)}
                      className="text-left"
                    >
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
                        €<Copy>{i.p.toFixed(2)}</Copy>
                      </p>
                    </SourceButton>

                    <Copy>
                      {q === 0 ? (
                        <SourceButton
                          onClick={() => quickAdd(i)}
                          aria-label={`Add ${i.n}`}
                          className="h-9 w-9 shrink-0 text-lg font-bold"
                          style={btn}
                        >
                          +
                        </SourceButton>
                      ) : (
                        <div className="flex shrink-0 items-center" style={btn}>
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
                    </Copy>
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

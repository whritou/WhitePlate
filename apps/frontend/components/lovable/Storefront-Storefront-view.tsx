"use client"
import { Copy } from "@/components/lovable/copy"
import {
  SourceButton,
  SourceSelect,
  SourceOption,
} from "@/components/ui/lovable-controls"
import { themeVariables } from "@/lib/lovable/storeTheme"
import { tx } from "@/lib/lovable/menu"
import { ProductModal } from "./Storefront-shared"
import { useStorefrontView } from "./Storefront-Storefront-context"
import { StorefrontSection1 } from "./Storefront-Storefront-section-1"
import { StorefrontSection4 } from "./Storefront-Storefront-section-4"
export function StorefrontView() {
  const {
    t,
    menu,
    lang,
    setLang,
    cartLoaded,
    cat,
    setCat,
    open,
    setOpen,
    cartOpen,
    setCartOpen,
    u,
    MENU,
    r,
    muted,
    line,
    count,
    total,
    add,
    btn,
  } = useStorefrontView()

  return (
    <div
      style={themeVariables(t)}
      data-button-style={t.buttonStyle}
      className="customer-page storefront-page relative min-h-full bg-background text-foreground"
    >
      <header
        className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 px-6 py-3"
        style={{ background: t.bg, borderBottom: `1px solid ${line}` }}
      >
        <div className="flex items-center gap-3">
          <Copy>
            {t.logo && (
              <img
                src={t.logo}
                alt={`${t.name} logo`}
                className="h-10 w-10 object-contain"
              />
            )}
          </Copy>

          <span className="text-xl font-bold">
            <Copy>{t.name}</Copy>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Copy>
            {menu.languages.length > 1 && (
              <SourceSelect
                value={lang}
                disabled={!cartLoaded}
                onChange={(e) => setLang(e.target.value)}
                aria-label="Language"
                className="px-2 py-2 text-sm font-bold uppercase"
                style={{
                  border: `1px solid ${line}`,
                  borderRadius: r,
                  background: t.bg,
                  color: t.text,
                }}
              >
                <Copy>
                  {menu.languages.map((l) => (
                    <SourceOption key={l} value={l}>
                      <Copy>{l.toUpperCase()}</Copy>
                    </SourceOption>
                  ))}
                </Copy>
              </SourceSelect>
            )}
          </Copy>

          <SourceButton
            onClick={() => setCartOpen(true)}
            className="px-4 py-2 text-sm font-bold"
            style={{ background: t.primary, color: t.bg, borderRadius: r }}
          >
            <Copy>{u("basket")}</Copy> · <Copy>{count}</Copy>
          </SourceButton>
        </div>
      </header>

      <Copy>
        {t.showBanner && (
          <section
            className={`customer-banner relative flex items-center overflow-hidden px-6 py-8 ${t.bannerAlign === "center" ? "justify-center text-center" : "text-left"}`}
          >
            <Copy>
              {t.banner && (
                <img
                  src={t.banner}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
            </Copy>

            <div className="customer-banner-overlay absolute inset-0" />

            <div className="relative">
              <p
                className="inline-block px-2 py-1 text-xs font-bold tracking-widest uppercase"
                style={{ background: t.accent, color: t.text, borderRadius: r }}
              >
                <Copy>{u("open")}</Copy> <Copy>{t.prepTime}</Copy>
              </p>

              <h1 className="mt-4 text-4xl leading-tight font-bold md:text-5xl">
                <Copy>{t.name}</Copy>
              </h1>

              <p className="mt-2 opacity-90">
                <Copy>{t.tagline}</Copy>
              </p>
            </div>
          </section>
        )}
      </Copy>

      <Copy>
        {t.showRestaurantInfo && (
          <section
            className="grid gap-px sm:grid-cols-3"
            style={{ background: line, borderBottom: `1px solid ${line}` }}
          >
            <Copy>
              {[
                [u("address"), t.address],
                [u("hours"), t.hours],
                [u("phone"), t.phone],
              ].map(([k, v]) => (
                <div key={k} className="px-6 py-3" style={{ background: t.bg }}>
                  <p
                    className="text-xs font-bold tracking-wider uppercase"
                    style={{ color: muted }}
                  >
                    <Copy>{k}</Copy>
                  </p>

                  <p className="text-sm font-semibold">
                    <Copy>{v}</Copy>
                  </p>
                </div>
              ))}
            </Copy>
          </section>
        )}
      </Copy>

      <nav className="flex gap-2 overflow-x-auto px-6 py-4">
        {[
          { id: "all", label: u("all") },
          ...MENU.map((m) => ({ id: m.id, label: tx(m, "cat", lang) })),
        ].map((c) => (
          <SourceButton
            key={c.id}
            onClick={() => setCat(c.id)}
            className="px-4 py-1.5 text-sm font-semibold whitespace-nowrap"
            style={{
              borderRadius: r,
              border: `1px solid ${c.id === cat ? t.primary : line}`,
              background: c.id === cat ? t.primary : "transparent",
              color: c.id === cat ? t.bg : t.text,
            }}
          >
            <Copy>{c.label}</Copy>
          </SourceButton>
        ))}
      </nav>

      <StorefrontSection1 />

      <Copy>
        {count > 0 && !cartOpen && (
          <SourceButton
            onClick={() => setCartOpen(true)}
            className="sticky bottom-4 z-10 mx-6 flex w-[calc(100%-3rem)] items-center justify-between px-5 py-3 font-bold"
            style={{ background: t.text, color: t.bg, borderRadius: r }}
          >
            <span>
              <Copy>{count}</Copy> <Copy>{u("items")}</Copy> · €
              <Copy>{total.toFixed(2)}</Copy>
            </span>

            <span className="px-3 py-1" style={btn}>
              <Copy>{u("view")}</Copy> →
            </span>
          </SourceButton>
        )}
      </Copy>

      <Copy>
        {open && (
          <ProductModal
            p={open}
            t={t}
            r={r}
            line={line}
            muted={muted}
            lang={lang}
            u={u}
            menu={menu}
            onClose={() => setOpen(null)}
            onAdd={(picks, unit, qty) => {
              add(open, picks, unit, qty)
              setOpen(null)
            }}
          />
        )}
      </Copy>

      <StorefrontSection4 />
    </div>
  )
}

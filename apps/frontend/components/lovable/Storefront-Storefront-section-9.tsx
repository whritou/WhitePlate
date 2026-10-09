"use client"
import { Copy } from "@/components/lovable/copy"
import { SourceButton, SourceInput } from "@/components/ui/lovable-controls"
import { Button } from "@/components/ui/lovable-button"
import { writeCart } from "@/lib/lovable/customerOrder"
import { tx } from "@/lib/lovable/menu"
import { useStorefrontView } from "./Storefront-Storefront-context"
export function StorefrontSection9() {
  const {
    t,
    preview,
    navigate,
    lang,
    lines,
    setCartOpen,
    placed,
    setPlaced,
    code,
    setCode,
    applied,
    setApplied,
    checkoutError,
    setCheckoutError,
    u,
    r,
    muted,
    line,
    subtotal,
    disc,
    total,
    change,
    btn,
  } = useStorefrontView()

  return (
    <>
      {placed ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-4xl">✅</p>

          <p className="text-xl font-bold">
            <Copy>{u("placed")}</Copy>
          </p>

          <p style={{ color: muted }}>
            <Copy>{u("pickAt")}</Copy> <Copy>{t.address}</Copy>{" "}
            <Copy>{u("inAbout")}</Copy> <Copy>{t.prepTime}</Copy>.
          </p>

          <SourceButton
            onClick={() => {
              setPlaced(false)
              setCartOpen(false)
            }}
            className="mt-2 px-4 py-2 font-bold"
            style={btn}
          >
            <Copy>{u("back")}</Copy>
          </SourceButton>
        </div>
      ) : lines.length === 0 ? (
        <p
          className="flex flex-1 items-center justify-center p-6"
          style={{ color: muted }}
        >
          <Copy>{u("empty")}</Copy>
        </p>
      ) : (
        <>
          <ul className="flex-1 space-y-3 overflow-y-auto p-5">
            {lines.map((l) => (
              <li key={l.key} className="flex gap-3">
                <Copy>
                  {l.product.images[0] ? (
                    <img
                      src={l.product.images[0]}
                      alt=""
                      className="h-14 w-14 object-cover"
                      style={{ borderRadius: r }}
                    />
                  ) : (
                    <div
                      className="h-14 w-14"
                      style={{ background: line, borderRadius: r }}
                    />
                  )}
                </Copy>

                <div className="flex-1">
                  <p className="leading-tight font-bold">
                    {tx(l.product, "n", lang)}
                  </p>

                  <Copy>
                    {l.picks.length > 0 && (
                      <p className="text-xs" style={{ color: muted }}>
                        <Copy>{l.picks.join(" · ")}</Copy>
                      </p>
                    )}
                  </Copy>

                  <p className="text-sm font-bold" style={{ color: t.primary }}>
                    €<Copy>{(l.unit * l.qty).toFixed(2)}</Copy>
                  </p>
                </div>

                <div className="flex h-8 items-center self-center" style={btn}>
                  <SourceButton
                    onClick={() => change(l.key, -1)}
                    className="w-8 font-bold"
                  >
                    −
                  </SourceButton>

                  <span className="w-5 text-center text-sm font-bold">
                    <Copy>{l.qty}</Copy>
                  </span>

                  <SourceButton
                    onClick={() => change(l.key, 1)}
                    className="w-8 font-bold"
                  >
                    +
                  </SourceButton>
                </div>
              </li>
            ))}
          </ul>

          <div
            className="space-y-2 p-5"
            style={{ borderTop: `1px solid ${line}` }}
          >
            <div className="flex gap-2">
              <SourceInput
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={u("code")}
                className="min-w-0 flex-1 px-3 py-2 text-sm uppercase"
                style={{
                  border: `1px solid ${line}`,
                  borderRadius: r,
                  background: t.bg,
                  color: t.text,
                }}
              />

              <SourceButton
                onClick={() => setApplied(code)}
                className="px-3 text-sm font-bold"
                style={btn}
              >
                <Copy>{u("apply")}</Copy>
              </SourceButton>
            </div>

            <Copy>
              {disc && (
                <p
                  className="text-xs font-bold"
                  style={{ color: disc.ok ? t.primary : "#d33" }}
                >
                  <Copy>{applied}</Copy> · <Copy>{disc.msg}</Copy>
                </p>
              )}
            </Copy>

            <div
              className="flex justify-between text-sm"
              style={{ color: muted }}
            >
              <span>
                <Copy>{u("subtotal")}</Copy>
              </span>

              <span>
                €<Copy>{subtotal.toFixed(2)}</Copy>
              </span>
            </div>

            <Copy>
              {disc?.ok && (
                <div
                  className="flex justify-between text-sm"
                  style={{ color: t.primary }}
                >
                  <span>
                    <Copy>{u("discount")}</Copy>
                  </span>

                  <span>
                    −€<Copy>{disc.amount.toFixed(2)}</Copy>
                  </span>
                </div>
              )}
            </Copy>

            <div
              className="flex justify-between text-sm"
              style={{ color: muted }}
            >
              <span>
                <Copy>{u("pickup")}</Copy>
              </span>

              <span>
                ~<Copy>{t.prepTime}</Copy>
              </span>
            </div>

            <div className="flex justify-between text-lg font-bold">
              <span>
                <Copy>{u("total")}</Copy>
              </span>

              <span>
                €<Copy>{total.toFixed(2)}</Copy>
              </span>
            </div>

            <Copy>
              {checkoutError && (
                <p role="alert" className="text-sm text-destructive">
                  <Copy>{checkoutError}</Copy>
                </p>
              )}
            </Copy>

            <Button
              onClick={() => {
                if (preview) {
                  setCheckoutError(
                    "Select Checkout above to preview the next page."
                  )

                  return
                }

                if (!writeCart({ lines, code: applied, lang })) {
                  setCheckoutError(
                    "Your basket could not be saved. Please try fewer items."
                  )

                  return
                }

                navigate({ to: "/checkout" })
              }}
              className="h-12 w-full font-bold"
              style={{
                background: t.primary,
                color: t.bg,
                borderRadius: r,
              }}
            >
              <Copy>{lang === "fr" ? "Passer au paiement" : "Checkout"}</Copy> ·
              €<Copy>{total.toFixed(2)}</Copy>
            </Button>
          </div>
        </>
      )}
    </>
  )
}

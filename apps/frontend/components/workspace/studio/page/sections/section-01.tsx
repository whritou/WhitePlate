"use client"
import { Copy } from "@/components/shared/translated-copy"
import { useTranslations } from "next-intl"
import { Storefront } from "@/components/storefront/demo/storefront/storefront"
import { CustomerCheckout } from "@/components/storefront/demo/checkout/checkout"
import { CustomerTracking } from "@/components/storefront/demo/tracking/customer-tracking"
import { PREVIEW_ORDER } from "@/lib/lovable/customerOrder"
import { useStudioPageView } from "../context"
import { StudioPageSection2 } from "./section-02"
export function StudioPageSection1() {
  const text = useTranslations("ThemeStudio")
  const {
    t,
    device,
    page,
    previewCart,
    setPreviewCart,
    saved,
    menu,
    connected,
    panel,
    brandAssets,
  } = useStudioPageView()

  return (
    <div
      id="studio-panel"
      role="tabpanel"
      aria-labelledby={`studio-tab-${panel}`}
      tabIndex={0}
      className="flex min-h-0 flex-1 flex-col sm:flex-row"
    >
      <StudioPageSection2 />

      <main
        className={`flex min-w-0 flex-1 overflow-auto ${connected && panel === "brand" ? "bg-background" : "flex-col items-center bg-secondary p-3 lg:p-8"}`}
      >
        {connected && panel === "brand" && brandAssets ? (
          <div className="live-page w-full">{brandAssets}</div>
        ) : (
          <div
            className={`card-hard flex w-full flex-col bg-background transition-all ${device === "mobile" ? "max-w-[390px]" : "max-w-5xl"}`}
          >
            <div className="flex items-center gap-2 border-b px-4 py-2">
              <span className="h-2.5 w-2.5 bg-destructive" />

              <span className="h-2.5 w-2.5 bg-accent" />

              <span className="h-2.5 w-2.5 bg-primary" />

              <span className="label-mono ml-3 flex-1 truncate border px-3 py-1 text-muted-foreground">
                <Copy>
                  {t.domainStatus === "connected"
                    ? t.domain
                    : `${t.name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.whiteplate.app`}
                </Copy>
              </span>
            </div>

            <div className="h-[70vh] overflow-y-auto">
              <Copy>
                {page === "store" ? (
                  <Storefront t={t} menu={menu} preview />
                ) : page === "checkout" ? (
                  <CustomerCheckout
                    t={t}
                    menu={menu}
                    cart={previewCart}
                    onChange={setPreviewCart}
                    preview
                  />
                ) : (
                  <CustomerTracking t={t} order={PREVIEW_ORDER} preview />
                )}
              </Copy>
            </div>
          </div>
        )}

        <Copy>
          {!saved && panel === "design" && (
            <p className="label-mono mt-4 text-muted-foreground">
              {connected ? (
                text("unsaved")
              ) : (
                <Copy>Unsaved demo changes — save to this browser</Copy>
              )}
            </p>
          )}
        </Copy>
      </main>
    </div>
  )
}

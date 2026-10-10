"use client"
import { Copy } from "@/components/lovable/copy"
import { Storefront } from "@/components/lovable/Storefront"
import { CustomerCheckout } from "@/components/lovable/CustomerCheckout"
import { CustomerTracking } from "@/components/lovable/CustomerTracking"
import { PREVIEW_ORDER } from "@/lib/lovable/customerOrder"
import { useStudioPageView } from "./studio-StudioPage-context"
import { StudioPageSection2 } from "./studio-StudioPage-section-2"
export function StudioPageSection1() {
  const { t, device, page, previewCart, setPreviewCart, saved, menu } =
    useStudioPageView()

  return (
    <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
      <StudioPageSection2 />

      <main className="flex min-w-0 flex-1 flex-col items-center overflow-auto bg-secondary p-3 lg:p-8">
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

        <Copy>
          {!saved && (
            <p className="label-mono mt-4 text-muted-foreground">
              <Copy>Unsaved demo changes — save to this browser</Copy>
            </p>
          )}
        </Copy>
      </main>
    </div>
  )
}

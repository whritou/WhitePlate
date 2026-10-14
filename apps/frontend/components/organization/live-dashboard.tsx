import { ArrowRight, ArrowUpRight, CircleAlert, Store } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { DashboardMetricsStrip } from "@/components/organization/dashboard-metrics-strip"
import { LiveDashboardOrderContent } from "@/components/organization/live-dashboard-order-content"
import { OrderingOperationsController } from "@/components/organization/ordering-operations-controller"
import { OrderingOperationsPauseAction } from "@/components/organization/ordering-operations-panel"
import { Button } from "@/components/ui/button"
import { LiveProductCover } from "./live-product-cover"
import { StorefrontShortcuts } from "./storefront-shortcuts"
import type { LiveDashboardProps } from "@/types/live-workspace"

export async function LiveDashboard(props: LiveDashboardProps) {
  const { tenantName, tenantId, userId, role, locale } = props
  const t = await getTranslations("LiveWorkspace")
  const parity = await getTranslations("LiveParity")
  const canManageStorefront = role !== "Kitchen"

  return (
    <OrderingOperationsController
      userId={userId}
      tenantId={tenantId}
      locale={locale}
      role={role}
      initialOperations={props.initialOrderingOperations ?? null}
    >
      <main className="mx-auto max-w-[1600px] px-6 pb-12">
        <header className="flex flex-wrap items-end justify-between gap-5 py-8">
          <div className="min-w-0">
            <p className="label-mono text-muted-foreground">{tenantName}</p>

            <h1 className="mt-2 font-display text-4xl font-bold">
              {parity("dashboardTitle")}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <OrderingOperationsPauseAction />

            <Button
              nativeButton={false}
              role="link"
              render={
                <Link href={`/organization/orders?tenantId=${tenantId}`} />
              }
            >
              {t("openOrders")}

              <ArrowUpRight aria-hidden="true" />
            </Button>
          </div>
        </header>

        <DashboardMetricsStrip
          userId={userId}
          tenantId={tenantId}
          locale={locale}
          role={role}
          initialMetrics={props.initialDashboardMetrics ?? null}
        />

        <LiveDashboardOrderContent
          {...props}
          storefront={
            <StorefrontSection
              {...props}
              canManageStorefront={canManageStorefront}
            />
          }
        />
      </main>
    </OrderingOperationsController>
  )
}

async function StorefrontSection({
  tenantName,
  tenantId,
  userId,
  catalog,
  storefrontUrl,
  canManageStorefront,
}: LiveDashboardProps & { canManageStorefront: boolean }) {
  const t = await getTranslations("LiveWorkspace")
  const parity = await getTranslations("LiveParity")

  return (
    <section
      aria-labelledby="live-dashboard-storefront-title"
      className="xl:border-s xl:ps-8"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2
          id="live-dashboard-storefront-title"
          className="font-display text-2xl font-bold"
        >
          {parity("storefront")}
        </h2>

        <Store aria-hidden="true" className="size-5 text-muted-foreground" />
      </div>

      {catalog && (
        <div className="grid grid-cols-2 gap-3">
          {catalog.products
            .filter((product) => !product.isArchived)
            .slice(0, 2)
            .map((product) => (
              <div key={product.id} className="min-w-0">
                <LiveProductCover
                  className="aspect-[2/1] w-full border"
                  userId={userId}
                  tenantId={tenantId}
                  productId={product.id}
                />

                <p className="mt-2 truncate text-sm">{product.name}</p>
              </div>
            ))}
        </div>
      )}

      <h3 className="mt-4 text-lg font-bold break-words">{tenantName}</h3>

      <p className="mt-4 flex items-center gap-2 text-sm">
        <CircleAlert
          aria-hidden="true"
          className="size-4 text-muted-foreground"
        />

        <span>{t("paymentsPending")}</span>
      </p>

      {canManageStorefront && (
        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            nativeButton={false}
            role="link"
            variant="outline"
            render={
              <Link href={`/organization/theming?tenantId=${tenantId}`} />
            }
          >
            {t("openStudio")}

            <ArrowRight aria-hidden="true" />
          </Button>

          <Button
            nativeButton={false}
            role="link"
            variant="ghost"
            render={
              <Link href={`/organization/catalog?tenantId=${tenantId}`} />
            }
          >
            {t("openMenu")}
          </Button>
        </div>
      )}

      <div className="mt-5">
        <StorefrontShortcuts
          url={storefrontUrl ?? null}
          fallbackHref={`/organization/shop?tenantId=${tenantId}`}
          labels={{
            visitShop: t("visitShop"),
            copyShopUrl: t("copyShopUrl"),
            copiedShopUrl: t("copiedShopUrl"),
            copyShopUrlFailed: t("copyShopUrlFailed"),
            showShopQr: t("showShopQr"),
            hideShopQr: t("hideShopQr"),
            shopQrLabel: t("shopQrLabel"),
            shopUnavailable: t("shopUnavailable"),
          }}
        />
      </div>
    </section>
  )
}

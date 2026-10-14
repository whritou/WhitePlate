import { ArrowRight, ArrowUpRight, CreditCard, Store } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { OrderOverview } from "@/components/orders/order-overview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LiveProductCover } from "./live-product-cover"
import { MenuBuilderRetry } from "./menu-builder-retry"
import { ProductAvailabilityControls } from "./product-availability-controls"
import { StorefrontShortcuts } from "./storefront-shortcuts"
import type { LiveDashboardProps } from "@/types/live-workspace"

export async function LiveDashboard({
  tenantName: name,
  tenantId,
  page,
  locale,
  catalog,
  userId,
  role,
  loadError,
  hubUrl,
  productAvailability,
  availabilityLoadError,
  storefrontUrl,
}: LiveDashboardProps) {
  const t = await getTranslations("LiveWorkspace")
  const v = await getTranslations("LiveParity")
  const k = await getTranslations("KitchenOrders")
  const canManageStorefront = role !== "Kitchen"

  return (
    <main className="live-dashboard mx-auto grid max-w-[1600px] min-w-0 gap-7 px-4 pb-12 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4 pt-6 sm:pt-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="label-mono text-muted-foreground">{name}</p>

            <Badge variant="outline">{k(`roles.${role}`)}</Badge>
          </div>

          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            {v("dashboardTitle")}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t("dashboardScope")}
          </p>
        </div>

        <Button
          nativeButton={false}
          role="link"
          render={<Link href={`/organization/orders?tenantId=${tenantId}`} />}
        >
          {t("openOrders")}

          <ArrowUpRight aria-hidden="true" />
        </Button>
      </header>

      <OrderOverview
        userId={userId}
        tenantId={tenantId}
        tenantName={name}
        role={role}
        locale={locale}
        selectedStatus={null}
        cursor={null}
        page={page}
        loadError={loadError}
        hubUrl={hubUrl}
      />

      <section
        className="min-w-0 border-t pt-7"
        aria-labelledby="availability-title"
      >
        <div className="mb-4">
          <h2
            id="availability-title"
            className="font-display text-2xl font-bold"
          >
            {t("quickAvailability")}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t("quickAvailabilityHelp")}
          </p>
        </div>

        {availabilityLoadError ? (
          <div role="alert" className="grid justify-items-start gap-1">
            <p className="text-sm text-muted-foreground">
              {t("availabilityLoadError")}
            </p>

            <MenuBuilderRetry />
          </div>
        ) : productAvailability?.length ? (
          <ProductAvailabilityControls
            tenantId={tenantId}
            products={productAvailability}
            labels={{
              available: t("productAvailable"),
              unavailable: t("productUnavailable"),
              markAvailable: t("markAvailable"),
              markUnavailable: t("markUnavailable"),
              availabilityFor: t("availabilityFor"),
              updating: t("updatingAvailability"),
              updated: t("availabilityUpdated"),
              updateFailed: t("availabilityUpdateFailed"),
            }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("availabilityEmpty")}
          </p>
        )}
      </section>

      <div className="grid min-w-0 gap-8 border-t pt-7 lg:grid-cols-[1fr_1.2fr] [&>section]:min-w-0">
        {canManageStorefront && (
          <section>
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-bold">
                {v("connections")}
              </h2>

              <CreditCard
                aria-hidden="true"
                className="size-5 text-muted-foreground"
              />
            </div>

            <div className="border-y py-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
                <CreditCard aria-hidden="true" className="size-4" />

                {v("payment")}
              </h3>

              <p className="text-sm text-muted-foreground">
                {v("paymentHelp")}
              </p>

              <Button disabled variant="outline" className="mt-4">
                {t("paymentsPending")}
              </Button>
            </div>
          </section>
        )}

        <section className={canManageStorefront ? "lg:border-l lg:pl-8" : ""}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold">
              {v("storefront")}
            </h2>

            <Store
              aria-hidden="true"
              className="size-5 text-muted-foreground"
            />
          </div>

          {catalog && (
            <div className="grid grid-cols-2 gap-3 sm:max-w-xl">
              {catalog.products
                .filter((item) => !item.isArchived)
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

          <h3 className="mt-4 text-lg font-bold break-words">{name}</h3>

          <div className="mt-5 flex flex-wrap gap-2">
            {canManageStorefront && (
              <>
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
              </>
            )}
          </div>

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
      </div>
    </main>
  )
}

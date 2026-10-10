import {
  ArrowRight,
  ArrowUpRight,
  CreditCard,
  Store,
  ShoppingBag,
  Wallet,
  Radio,
} from "lucide-react"
import { LiveProductCover } from "./live-product-cover"
import type { ManagedCatalog } from "@/types/catalog-management"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import type { OrderPage } from "@/types/orders"
export async function LiveDashboard({
  name,
  tenantId,
  page,
  locale,
  catalog,
  userId,
}: {
  name: string
  tenantId: string
  page: OrderPage
  locale: string
  catalog?: ManagedCatalog
  userId?: string
}) {
  const t = await getTranslations("LiveWorkspace")
  const v = await getTranslations("LiveParity")
  const labels = await getTranslations("LovableLive")
  const k = await getTranslations("KitchenOrders")
  const totals = new Map<string, number>()

  for (const order of page.items)
    totals.set(order.currency, (totals.get(order.currency) ?? 0) + order.total)

  const amount =
    [...totals]
      .map(([currency, value]) =>
        new Intl.NumberFormat(locale, { style: "currency", currency }).format(
          value
        )
      )
      .join(" · ") || "—"

  return (
    <main className="live-dashboard mx-auto max-w-[1600px] px-6 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-5 py-8">
        <div>
          <p className="label-mono text-muted-foreground">{name}</p>

          <h1 className="mt-2 font-display text-4xl font-bold">
            {v("dashboardTitle")}
          </h1>

          <p className="mt-3 max-w-2xl text-xs text-muted-foreground">
            {t("dashboardScope")}
          </p>
        </div>

        <Button
          nativeButton={false}
          role="link"
          render={<Link href={`/organization/orders?tenantId=${tenantId}`} />}
        >
          {t("openOrders")}

          <ArrowUpRight />
        </Button>
      </header>

      <div className="grid border-y sm:grid-cols-2 xl:grid-cols-4">
        {[
          [t("loadedOrders"), page.items.length, ShoppingBag],
          [t("loadedTotal"), amount, Wallet],
          [
            k("statuses.Pending"),
            page.items.filter((item) => item.status === "Pending").length,
            Radio,
          ],
          [
            k("statuses.Ready"),
            page.items.filter((item) => item.status === "Ready").length,
            Store,
          ],
        ].map(([label, value, Icon], index) => (
          <section
            className={`py-6 ${index ? "xl:border-l xl:pl-6" : ""} ${index < 3 ? "border-b xl:border-b-0" : ""}`}
            key={String(label)}
          >
            <div className="flex items-center justify-between pr-6 text-muted-foreground">
              <h2 className="text-sm">{String(label)}</h2>

              {typeof Icon !== "string" && typeof Icon !== "number" && Icon && (
                <Icon className="size-4" />
              )}
            </div>

            <p className="mt-3 font-display text-4xl font-bold">
              {String(value)}
            </p>
          </section>
        ))}
      </div>

      <div className="grid gap-8 py-8 xl:grid-cols-[1.55fr_1fr] [&>section]:min-w-0">
        <section>
          <h2 className="mb-5 font-display text-2xl font-bold">
            {v("kitchen")}
          </h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["Pending", "Preparing", "Ready", "Completed"] as const).map(
              (status) => (
                <Link
                  key={status}
                  href={`/organization/orders?tenantId=${tenantId}&status=${status}`}
                  className={`border p-4 hover:opacity-80 ${status === "Pending" ? "bg-accent" : status === "Preparing" ? "bg-primary text-primary-foreground" : status === "Ready" ? "bg-foreground text-background" : "bg-secondary"}`}
                >
                  <p className="text-sm font-medium">
                    {k(`statuses.${status}`)}
                  </p>

                  <p className="mt-4 text-4xl font-bold">
                    {page.items.filter((item) => item.status === status).length}
                  </p>

                  <ArrowRight className="mt-5 size-4" />
                </Link>
              )
            )}
          </div>
        </section>

        <section className="xl:border-l xl:pl-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">
              {v("connections")}
            </h2>

            <CreditCard className="size-5 text-muted-foreground" />
          </div>

          <div className="border-y py-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <CreditCard className="size-4" /> {v("payment")}
            </h3>

            <p className="text-sm text-muted-foreground">{v("paymentHelp")}</p>

            <Button disabled variant="outline" className="mt-4">
              {t("paymentsPending")}
            </Button>
          </div>

          <div className="border-b py-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <Radio className="size-4" /> {v("orderConnection")}
            </h3>

            <p className="text-sm text-muted-foreground">{v("snapshotHelp")}</p>

            <p className="mt-3 text-sm">
              {t("loadedOrders")}: {page.items.length}
            </p>
          </div>
        </section>
      </div>

      <div className="grid gap-8 border-t pt-7 xl:grid-cols-[1.55fr_1fr] [&>section]:min-w-0">
        <section>
          <h2 className="mb-5 font-display text-2xl font-bold">
            {v("latestOrders")}
          </h2>

          {page.items.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{v("orderCustomer")}</TableHead>

                  <TableHead>{v("created")}</TableHead>

                  <TableHead>{labels("status")}</TableHead>

                  <TableHead className="text-right">
                    {t("loadedTotal")}
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {[...page.items]
                  .sort(
                    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
                  )
                  .slice(0, 5)
                  .map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="py-3">
                        <Link
                          href={`/organization/orders?tenantId=${tenantId}`}
                          className="font-bold hover:text-primary"
                        >
                          #{order.id.slice(0, 8)}
                        </Link>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {order.customerName}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {order.lines
                            .map(
                              (line) => `${line.quantity} × ${line.productName}`
                            )
                            .join(" · ")}
                        </p>
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        {new Intl.DateTimeFormat(locale, {
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(order.createdAt))}
                      </TableCell>

                      <TableCell>
                        <span className="inline-flex items-center gap-2">
                          <span
                            className={`size-2 ${order.status === "Pending" ? "bg-accent" : "bg-primary"}`}
                          />

                          {k(`statuses.${order.status}`)}
                        </span>
                      </TableCell>

                      <TableCell className="text-right font-medium tabular-nums">
                        {new Intl.NumberFormat(locale, {
                          style: "currency",
                          currency: order.currency,
                        }).format(order.total)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : (
            <p className="p-5 text-muted-foreground">{t("emptyDashboard")}</p>
          )}
        </section>

        <section className="xl:border-l xl:pl-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">
              {v("storefront")}
            </h2>

            <Store className="size-5 text-muted-foreground" />
          </div>

          {catalog && (
            <div className="grid grid-cols-2 gap-3">
              {catalog.products
                .filter((item) => !item.isArchived)
                .slice(0, 2)
                .map((product) => (
                  <div key={product.id}>
                    <LiveProductCover
                      className="aspect-[2/1] w-full border"
                      userId={userId}
                      tenantId={tenantId}
                      productId={product.id}
                    />

                    <p className="mt-2 text-sm">{product.name}</p>
                  </div>
                ))}
            </div>
          )}

          <h3 className="mt-4 text-lg font-bold">{name}</h3>

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

              <ArrowRight />
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

            <Button
              nativeButton={false}
              role="link"
              variant="outline"
              render={<Link href={`/organization/shop?tenantId=${tenantId}`} />}
            >
              {t("visitShop")}

              <ArrowUpRight />
            </Button>
          </div>
        </section>
      </div>
    </main>
  )
}

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
}: {
  name: string
  tenantId: string
  page: OrderPage
  locale: string
}) {
  const t = await getTranslations("LiveWorkspace")
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
    <main className="live-page">
      <header className="mb-6">
        <p className="label-mono text-muted-foreground">{name}</p>

        <h1 className="mt-1 font-display text-4xl font-bold">
          {t("dashboard")}
        </h1>

        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          {t("dashboardScope")}
        </p>
      </header>

      <div className="grid border-y sm:grid-cols-2 xl:grid-cols-4">
        {[
          [t("loadedOrders"), page.items.length],
          [t("loadedTotal"), amount],
          [
            k("statuses.Pending"),
            page.items.filter((item) => item.status === "Pending").length,
          ],
          [
            k("statuses.Ready"),
            page.items.filter((item) => item.status === "Ready").length,
          ],
        ].map(([label, value]) => (
          <section
            className="border-b py-6 pr-6 sm:border-r sm:pl-6"
            key={label}
          >
            <h2 className="label-mono text-muted-foreground">{label}</h2>

            <p className="mt-3 font-display text-4xl font-bold">{value}</p>
          </section>
        ))}
      </div>

      <div className="my-6 flex flex-wrap gap-3">
        <Button
          nativeButton={false}
          role="link"
          render={<Link href={`/organization/orders?tenantId=${tenantId}`} />}
        >
          {t("openOrders")}
        </Button>

        <Button
          nativeButton={false}
          role="link"
          variant="outline"
          render={<Link href={`/organization/catalog?tenantId=${tenantId}`} />}
        >
          {t("openMenu")}
        </Button>

        <Button
          nativeButton={false}
          role="link"
          variant="outline"
          render={<Link href={`/organization/theming?tenantId=${tenantId}`} />}
        >
          {t("openStudio")}
        </Button>
      </div>

      <section className="border-t pt-7">
        <h2 className="mb-5 font-display text-2xl font-bold">
          {t("realOrders")}
        </h2>

        {page.items.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("realOrders")}</TableHead>

                <TableHead>{labels("status")}</TableHead>

                <TableHead className="text-right">{t("loadedTotal")}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {page.items.map((order) => (
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
                        .map((line) => `${line.quantity} × ${line.productName}`)
                        .join(" · ")}
                    </p>
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
    </main>
  )
}

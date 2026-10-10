import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <section className="border p-5" key={label}>
            <h2 className="label-mono text-muted-foreground">{label}</h2>

            <p className="mt-3 font-display text-3xl font-bold">{value}</p>
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

      <section className="border">
        <h2 className="border-b p-5 font-display text-xl font-bold">
          {t("realOrders")}
        </h2>

        {page.items.length ? (
          <ul className="divide-y">
            {page.items.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 p-5"
              >
                <div>
                  <p className="font-bold">
                    #{order.id.slice(0, 8)} · {order.customerName}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {order.lines
                      .map((line) => `${line.quantity} × ${line.productName}`)
                      .join(" · ")}
                  </p>
                </div>

                <p className="border px-3 py-1 text-xs font-bold">
                  {k(`statuses.${order.status}`)}
                </p>

                <p className="font-bold tabular-nums">
                  {new Intl.NumberFormat(locale, {
                    style: "currency",
                    currency: order.currency,
                  }).format(order.total)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-5 text-muted-foreground">{t("emptyDashboard")}</p>
        )}
      </section>
    </main>
  )
}

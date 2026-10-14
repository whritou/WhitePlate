"use client"

import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import { ArrowRight, Check, CircleAlert, Store } from "lucide-react"
import { Copy } from "@/components/lovable/copy"
import { Link } from "@/components/lovable/navigation"
import { Button } from "@/components/ui/lovable-button"

const orders = [
  {
    id: "2481",
    name: "Camille R.",
    pickup: "12:45",
    amount: 28.5,
    status: "pending",
  },
  {
    id: "2480",
    name: "Noah M.",
    pickup: "12:40",
    amount: 16,
    status: "preparing",
  },
  {
    id: "2479",
    name: "Inès D.",
    pickup: "12:35",
    amount: 34.2,
    status: "ready",
  },
  {
    id: "2478",
    name: "Louis B.",
    pickup: "12:25",
    amount: 21,
    status: "collected",
  },
] as const

export function DashboardReviewPreviewActivity() {
  const t = useTranslations("DashboardReviewPreview")
  const locale = useLocale()
  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  })

  return (
    <div className="grid gap-8 border-t pt-7 xl:grid-cols-[1.55fr_1fr] [&>section]:min-w-0">
      <section aria-labelledby="preview-orders-title">
        <div className="mb-5 flex flex-wrap items-center justify-between">
          <h2 id="preview-orders-title" className="text-2xl font-bold">
            <Copy>Latest orders</Copy>
          </h2>

          <Button asChild variant="link" size="sm">
            <Link to="/orders">
              <Copy>View all</Copy>

              <ArrowRight />
            </Link>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-left text-sm">
            <thead className="border-b text-xs text-muted-foreground">
              <tr>
                <th className="pb-3 font-normal">
                  <Copy>Order / customer</Copy>
                </th>

                <th className="pb-3 font-normal">
                  <Copy>Pickup</Copy>
                </th>

                <th className="pb-3 font-normal">
                  <Copy>Status</Copy>
                </th>

                <th className="pb-3 text-right font-normal">
                  <Copy>Total</Copy>
                </th>
              </tr>
            </thead>

            <tbody>
              {[...orders]
                .sort((first, second) => Number(second.id) - Number(first.id))
                .map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="py-3">
                      <Link
                        to="/orders"
                        className="font-bold hover:text-primary"
                      >
                        #{order.id}
                      </Link>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {order.name} · Web
                      </p>
                    </td>

                    <td>{order.pickup}</td>

                    <td>
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={`h-2 w-2 ${order.status === "pending" ? "bg-accent" : "bg-primary"}`}
                        />

                        {t(`statuses.${order.status}`)}
                      </span>
                    </td>

                    <td className="text-right font-medium tabular-nums">
                      {money.format(order.amount)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="xl:border-l xl:pl-8">
        <div className="mb-5 flex flex-wrap items-center justify-between">
          <h2 className="text-2xl font-bold">
            <Copy>Your storefront</Copy>
          </h2>

          <Store aria-hidden="true" className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="relative aspect-[2/1] overflow-hidden">
            <Image
              src="/lovable/store/burger.jpg"
              alt={t("products.burger.alt")}
              fill
              sizes="(min-width: 1280px) 14rem, 50vw"
              className="object-cover"
            />
          </div>

          <div className="relative aspect-[2/1] overflow-hidden">
            <Image
              src="/lovable/store/bowl.jpg"
              alt={t("products.bowl.alt")}
              fill
              sizes="(min-width: 1280px) 14rem, 50vw"
              className="object-cover"
            />
          </div>
        </div>

        <h3 className="mt-4 text-lg font-bold">{t("restaurantName")}</h3>

        <p className="mt-1 text-sm text-muted-foreground">
          {t("storefrontLocation")}
        </p>

        <p className="mt-4 flex items-center gap-2 text-sm">
          <Check aria-hidden="true" className="h-4 w-4 text-primary" />

          <Copy>Store preview available</Copy>
        </p>

        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <CircleAlert aria-hidden="true" className="h-4 w-4" />

          <Copy>Checkout is not connected</Copy>
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/studio">
              <Copy>Edit storefront</Copy>

              <ArrowRight />
            </Link>
          </Button>

          <Button asChild variant="ghost">
            <Link to="/menu">
              <Copy>Manage menu</Copy>
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

import Image from "next/image"
import {
  Activity,
  Clock3,
  PackageCheck,
  Radio,
  ShoppingBag,
  Store,
  Wallet,
} from "lucide-react"
import { getLocale, getTranslations } from "next-intl/server"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const orders = [
  {
    id: "2481",
    name: "Camille R.",
    item: "Burrata & tomates",
    pickup: "12:45",
    amount: 28.5,
    status: "pending",
  },
  {
    id: "2480",
    name: "Noah M.",
    item: "Burger Maison",
    pickup: "12:40",
    amount: 16,
    status: "preparing",
  },
  {
    id: "2479",
    name: "Inès D.",
    item: "Bowl vert",
    pickup: "12:35",
    amount: 34.2,
    status: "ready",
  },
  {
    id: "2478",
    name: "Louis B.",
    item: "Burger Maison",
    pickup: "12:25",
    amount: 21,
    status: "collected",
  },
] as const

const products = [
  { key: "burrata", image: "/lovable/store/burrata.jpg", available: true },
  { key: "burger", image: "/lovable/store/burger.jpg", available: true },
  { key: "bowl", image: "/lovable/store/bowl.jpg", available: false },
] as const

const metricTones = {
  info: { background: "var(--info-muted)", text: "text-info", icon: Activity },
  warning: {
    background: "var(--warning-muted)",
    text: "text-warning",
    icon: ShoppingBag,
  },
  success: {
    background: "var(--success-muted)",
    text: "text-success",
    icon: Wallet,
  },
  neutral: {
    background: "var(--secondary)",
    text: "text-secondary-foreground",
    icon: Clock3,
  },
} as const

const statusVariants = {
  pending: "warning",
  preparing: "info",
  ready: "success",
  collected: "neutral",
} as const

export async function DashboardReviewPreview() {
  const t = await getTranslations("DashboardReviewPreview")
  const locale = await getLocale()
  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  })

  const metrics = [
    {
      key: "ordersToday",
      value: "18",
      note: t("ordersTodayNote"),
      tone: "info",
    },
    {
      key: "activeQueue",
      value: "5",
      note: t("activeQueueNote"),
      tone: "warning",
    },
    {
      key: "orderValue",
      value: money.format(486.5),
      note: t("orderValueNote"),
      tone: "success",
    },
    {
      key: "averagePrep",
      value: t("averagePrepValue"),
      note: t("averagePrepNote"),
      tone: "neutral",
    },
  ] as const

  return (
    <main
      data-testid="dashboard-review-preview"
      className="live-dashboard mx-auto grid max-w-[1600px] min-w-0 gap-5 px-4 pt-5 pb-12 sm:gap-6 sm:px-6 sm:pt-7"
    >
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="label-mono text-muted-foreground">{t("eyebrow")}</p>

          <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">
            {t("title")}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <Badge variant="warning" className="rounded-none">
          {t("previewOnly")}
        </Badge>
      </header>

      <section aria-label={t("metricsLabel")}>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map(({ key, value, note, tone }) => {
            const style = metricTones[tone]
            const Icon = style.icon

            return (
              <Card
                key={key}
                className="gap-3 border-border/60 p-4 shadow-none sm:p-5"
                style={{ backgroundColor: style.background }}
              >
                <CardHeader className="flex flex-row items-center justify-between gap-2 p-0">
                  <CardTitle className="font-sans text-sm leading-5 font-medium">
                    {t(key)}
                  </CardTitle>

                  <Icon
                    aria-hidden="true"
                    className={`size-4 shrink-0 ${style.text}`}
                  />
                </CardHeader>

                <CardContent className="grid gap-1 p-0">
                  <p className="font-display text-3xl leading-none font-bold tabular-nums">
                    {value}
                  </p>

                  <p className="text-xs leading-5 text-muted-foreground">
                    {note}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(19rem,0.85fr)]">
        <section aria-labelledby="preview-orders-title" className="min-w-0">
          <Card className="gap-0 border-border/70 p-0 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-3 border-b p-4 sm:p-5">
              <div>
                <CardTitle className="font-display text-xl font-bold">
                  <h2 id="preview-orders-title">{t("latestOrders")}</h2>
                </CardTitle>

                <CardDescription className="mt-1">
                  {t("latestOrdersNote")}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <ul aria-label={t("latestOrders")}>
                {orders.map((order) => (
                  <li
                    key={order.id}
                    className="flex min-w-0 items-center justify-between gap-3 border-b px-4 py-3 last:border-b-0 sm:px-5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">
                        #{order.id}{" "}
                        <span className="font-medium">· {order.name}</span>
                      </p>

                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {order.pickup} · {order.item}
                      </p>
                    </div>

                    <div className="grid shrink-0 justify-items-end gap-1.5">
                      <Badge
                        variant={statusVariants[order.status]}
                        className="rounded-none text-xs"
                      >
                        {t(`statuses.${order.status}`)}
                      </Badge>

                      <span className="text-sm font-semibold tabular-nums">
                        {money.format(order.amount)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <div className="grid min-w-0 content-start gap-4">
          <section aria-labelledby="preview-order-state-title">
            <Card className="gap-0 border-border/70 p-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-3 p-4 pb-3">
                <CardTitle className="font-display text-lg font-bold">
                  <h2 id="preview-order-state-title">{t("orderState")}</h2>
                </CardTitle>

                <Badge variant="success" className="rounded-none text-xs">
                  {t("serviceOpen")}
                </Badge>
              </CardHeader>

              <CardContent className="grid gap-3 px-4 pb-4">
                <ul className="grid grid-cols-3 gap-2 border-b pb-3">
                  {(
                    [
                      ["pending", "2"],
                      ["preparing", "2"],
                      ["ready", "1"],
                    ] as const
                  ).map(([status, count]) => (
                    <li key={status} className="min-w-0">
                      <p className="text-xl font-bold tabular-nums">{count}</p>

                      <p className="text-xs leading-4 text-muted-foreground">
                        {t(`shortStatuses.${status}`)}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="neutral" className="rounded-none text-xs">
                    <Radio aria-hidden="true" /> {t("rushOff")}
                  </Badge>

                  <Badge variant="neutral" className="rounded-none text-xs">
                    <PackageCheck aria-hidden="true" /> {t("pauseOff")}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </section>

          <section aria-labelledby="preview-availability-title">
            <Card className="gap-0 border-border/70 p-0 shadow-sm">
              <CardHeader className="p-4 pb-3">
                <CardTitle className="font-display text-lg font-bold">
                  <h2 id="preview-availability-title">
                    {t("quickAvailability")}
                  </h2>
                </CardTitle>

                <CardDescription>{t("quickAvailabilityNote")}</CardDescription>
              </CardHeader>

              <CardContent className="p-0">
                <ul aria-label={t("quickAvailability")}>
                  {products.map((product) => (
                    <li
                      key={product.key}
                      className="flex min-w-0 items-center gap-3 border-t px-4 py-2.5"
                    >
                      <div className="relative size-12 shrink-0 overflow-hidden border border-border">
                        <Image
                          src={product.image}
                          alt={t(`products.${product.key}.alt`)}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {t(`products.${product.key}.name`)}
                        </p>

                        <p
                          className={`mt-0.5 text-xs ${product.available ? "text-success" : "text-muted-foreground"}`}
                        >
                          {product.available
                            ? t("available")
                            : t("unavailable")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>

          <section aria-labelledby="preview-storefront-title">
            <Card className="gap-0 border-border/70 p-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-3 p-4 pb-3">
                <CardTitle className="font-display text-lg font-bold">
                  <h2 id="preview-storefront-title">{t("storefront")}</h2>
                </CardTitle>

                <Store
                  aria-hidden="true"
                  className="size-4 text-muted-foreground"
                />
              </CardHeader>

              <CardContent className="grid gap-3 px-4 pb-4">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["burger", "/lovable/store/burger.jpg"],
                    ["bowl", "/lovable/store/bowl.jpg"],
                  ].map(([key, image]) => (
                    <div
                      key={key}
                      className="relative aspect-[2/1] overflow-hidden border border-border"
                    >
                      <Image
                        src={image}
                        alt={t(`products.${key}.alt`)}
                        fill
                        sizes="(min-width: 1280px) 14rem, 50vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold">{t("restaurantName")}</p>

                    <p className="text-xs text-muted-foreground">
                      {t("storefrontLocation")}
                    </p>
                  </div>

                  <Badge variant="neutral" className="rounded-none text-xs">
                    {t("storefrontPreview")}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{t("disclaimer")}</p>
    </main>
  )
}

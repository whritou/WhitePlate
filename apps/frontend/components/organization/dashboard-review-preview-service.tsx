"use client"

import Image from "next/image"
import { useTranslations } from "next-intl"
import {
  ArrowRight,
  ArrowUpRight,
  CreditCard,
  PackageCheck,
  Radio,
  Timer,
} from "lucide-react"
import { Copy } from "@/components/lovable/copy"
import { Link } from "@/components/lovable/navigation"
import { Button } from "@/components/ui/lovable-button"

const products = [
  { key: "burrata", image: "/lovable/store/burrata.jpg", available: true },
  { key: "burger", image: "/lovable/store/burger.jpg", available: true },
  { key: "bowl", image: "/lovable/store/bowl.jpg", available: false },
] as const

const stages = [
  { key: "pending", count: "2", tone: "bg-accent" },
  {
    key: "preparing",
    count: "2",
    tone: "bg-primary text-primary-foreground",
  },
  { key: "ready", count: "1", tone: "bg-foreground text-background" },
  { key: "collected", count: "13", tone: "bg-secondary" },
] as const

const statusCounts = [
  ["pending", "2"],
  ["preparing", "2"],
  ["ready", "1"],
] as const

export function DashboardReviewPreviewService({ paused }: { paused: boolean }) {
  const t = useTranslations("DashboardReviewPreview")

  return (
    <div className="grid gap-8 py-8 xl:grid-cols-[1.55fr_1fr] [&>section]:min-w-0">
      <section aria-labelledby="preview-kitchen-title">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2
            id="preview-kitchen-title"
            className="font-display text-2xl font-bold"
          >
            <Copy>In the kitchen</Copy>
          </h2>

          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className={`h-2 w-2 ${paused ? "bg-muted-foreground" : "bg-primary"}`}
            />

            <Copy>{paused ? "Demo paused" : "Demo service"}</Copy>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stages.map(({ key, count, tone }) => (
            <Link
              key={key}
              to="/orders"
              className={`border p-4 transition-opacity hover:opacity-80 ${tone}`}
            >
              <p className="text-sm font-medium">
                {key === "pending"
                  ? t("shortStatuses.pending")
                  : t(`statuses.${key}`)}
              </p>

              <p className="mt-4 text-4xl font-bold">{count}</p>

              <ArrowRight aria-hidden="true" className="mt-5 h-4 w-4" />
            </Link>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y py-4">
          <div className="flex items-center gap-3">
            <Timer aria-hidden="true" className="h-5 w-5 text-primary" />

            <div>
              <p className="text-sm font-medium">
                {t("lateOrdersSummary", { count: 0 })}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                <Copy>No late sample orders</Copy>
              </p>
            </div>
          </div>

          <Button asChild variant="link" size="sm">
            <Link to="/orders">
              <Copy>Review orders</Copy>

              <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      <section
        aria-labelledby="preview-connections-title"
        className="xl:border-l xl:pl-8"
      >
        <div className="mb-5 flex flex-wrap items-center justify-between">
          <h2
            id="preview-connections-title"
            className="font-display text-2xl font-bold"
          >
            <Copy>Connections</Copy>
          </h2>

          <span className="border px-2 py-1 text-xs">
            <Copy>Demo workspace</Copy>
          </span>
        </div>

        <div className="border-y py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 font-bold">
              <CreditCard aria-hidden="true" className="h-5 w-5" />

              <Copy>Stripe payments</Copy>
            </p>

            <span className="bg-secondary px-2 py-1 text-xs">
              <Copy>Not connected</Copy>
            </span>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">
            <Copy>
              No verified Stripe account. Charges and payouts are not available.
            </Copy>
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-between">
            <span className="text-xs text-primary">
              <Copy>WhitePlate commission · 0%</Copy>
            </span>

            <Button asChild variant="link" size="sm">
              <Link to="/settings" search={{ section: "payments" }}>
                <Copy>Payment settings</Copy>

                <ArrowUpRight />
              </Link>
            </Button>
          </div>
        </div>

        <div className="border-b py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 font-bold">
              <Radio aria-hidden="true" className="h-5 w-5" />

              {t("orderState")}
            </h3>

            <span
              className={`${paused ? "bg-secondary" : "bg-accent"} px-2 py-1 text-xs`}
            >
              {paused ? <Copy>Orders paused</Copy> : t("serviceOpen")}
            </span>
          </div>

          <ul className="mt-3 grid grid-cols-3 gap-2 border-b pb-3">
            {statusCounts.map(([status, count]) => (
              <li key={status} className="min-w-0">
                <p className="text-xl font-bold tabular-nums">{count}</p>

                <p className="text-xs leading-4 text-muted-foreground">
                  {t(`shortStatuses.${status}`)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 border px-2 py-1 text-xs text-muted-foreground">
              <Radio aria-hidden="true" className="size-3" />

              {t("rushOff")}
            </span>

            <span
              className={`inline-flex items-center gap-1 border px-2 py-1 text-xs ${paused ? "text-destructive" : "text-muted-foreground"}`}
            >
              <PackageCheck aria-hidden="true" className="size-3" />

              {paused ? t("pauseOn") : t("pauseOff")}
            </span>
          </div>
        </div>

        <div className="border-b py-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="font-bold">{t("quickAvailability")}</h3>

            <span className="text-xs text-muted-foreground">
              {t("quickAvailabilityNote")}
            </span>
          </div>

          <ul aria-label={t("quickAvailability")}>
            {products.map((product) => (
              <li
                key={product.key}
                className="flex min-w-0 items-center gap-3 border-t py-2"
              >
                <div className="relative size-10 shrink-0 overflow-hidden">
                  <Image
                    src={product.image}
                    alt={t(`products.${product.key}.alt`)}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>

                <p className="min-w-0 flex-1 truncate text-sm font-medium">
                  {t(`products.${product.key}.name`)}
                </p>

                <span
                  className={`shrink-0 text-xs ${product.available ? "text-primary" : "text-muted-foreground"}`}
                >
                  {product.available ? t("available") : t("unavailable")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}

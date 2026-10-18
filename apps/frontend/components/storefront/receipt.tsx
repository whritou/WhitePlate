"use client"

import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { getStorefrontTrackingHref } from "@/lib/storefront-preview-routing"
import type { OrderReceipt } from "@/types/checkout"
import { useLocale, useTranslations } from "next-intl"
import { CurrentCollectionInformation } from "./current-collection-information"

export function Receipt({
  receipt,
  trackingToken,
  restaurantSlug,
}: {
  receipt: OrderReceipt
  trackingToken: string | null
  restaurantSlug?: string
}) {
  const t = useTranslations("Checkout")
  const locale = useLocale()
  const price = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: receipt.currency,
  })

  return (
    <section
      aria-labelledby="cart-heading"
      lang={receipt.menuLocale ?? undefined}
      className="customer-two-column grid min-w-0 items-start gap-10"
    >
      <div className="min-w-0">
        <Card className="customer-rounded gap-0 p-5 sm:p-6">
          <CardHeader className="px-0">
            <CardTitle role="status">
              <h1 id="cart-heading" className="text-3xl font-bold">
                {t("orderConfirmed")}
              </h1>
            </CardTitle>

            <p className="mt-2 text-sm">{receipt.customerName}</p>

            <p className="mt-1 text-sm break-all text-muted-foreground">
              {t("orderReference", { id: receipt.id })}
            </p>

            <p className="mt-2 text-sm font-semibold">
              {t(`status.${receipt.status}`)}
            </p>

            {receipt.pickupAt && (
              <p className="mt-2 text-sm font-medium">
                {t("pickupAt", {
                  time: new Intl.DateTimeFormat(locale, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    timeZone: receipt.pickupTimeZone ?? undefined,
                    timeZoneName: "shortOffset",
                  }).format(new Date(receipt.pickupAt)),
                })}
              </p>
            )}

            {trackingToken && (
              <p className="mt-4">
                <Link
                  href={getStorefrontTrackingHref(
                    restaurantSlug,
                    receipt.id,
                    trackingToken
                  )}
                  locale={locale}
                  referrerPolicy="no-referrer"
                  className="font-medium text-brand-text underline underline-offset-4"
                >
                  {t("trackOrder")}
                </Link>
              </p>
            )}
          </CardHeader>
        </Card>

        <div className="mt-8">
          <CurrentCollectionInformation
            locale={receipt.menuLocale ?? locale}
            restaurantSlug={restaurantSlug}
          />
        </div>
      </div>

      <aside className="customer-summary min-w-0 border-t pt-6">
        <h2 className="text-lg font-bold">{t("cartTitle")}</h2>

        <div className="px-0">
          <ul className="mt-4 divide-y divide-border">
            {receipt.lines.map((line) => (
              <li key={line.productId} className="py-3">
                <div className="flex justify-between gap-3 text-sm">
                  <span>
                    {line.quantity} × {line.productName}
                  </span>

                  <span className="tabular-nums">
                    {price.format(line.total)}
                  </span>
                </div>

                {line.options.length > 0 && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {line.options.map((option) => option.name).join(", ")}
                  </p>
                )}
              </li>
            ))}
          </ul>

          <dl className="mt-4 grid gap-2 border-t border-border pt-4 text-sm">
            {[
              [t("subtotal"), receipt.subtotal],
              [
                t("discount"),
                receipt.discountAmount === 0 ? 0 : -receipt.discountAmount,
              ],
              [t("tax"), receipt.taxAmount],
              [t("total"), receipt.total],
            ].map(([label, amount]) => (
              <div
                key={String(label)}
                className="flex justify-between gap-3 last:mt-1 last:text-base last:font-semibold"
              >
                <dt>{label}</dt>

                <dd className="tabular-nums">{price.format(Number(amount))}</dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>
    </section>
  )
}

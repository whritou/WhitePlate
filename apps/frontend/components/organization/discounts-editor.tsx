"use client"

import { Plus } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { EditorDialog } from "@/components/ui/editor-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type {
  CatalogDiscount,
  DiscountsEditorProps,
} from "@/types/catalog-management"
import { DeactivateDiscountButton } from "./deactivate-discount-button"
import { DiscountForm } from "./discount-form"

function formatDiscountValue(
  discount: CatalogDiscount,
  currency: string,
  locale: string
) {
  return new Intl.NumberFormat(
    locale,
    discount.kind === "Percentage"
      ? { style: "percent", maximumFractionDigits: 2 }
      : { style: "currency", currency }
  ).format(
    discount.kind === "Percentage" ? discount.value / 100 : discount.value
  )
}

export function DiscountsEditor({
  tenantId,
  currency,
  discounts,
}: DiscountsEditorProps) {
  const t = useTranslations("Catalog")
  const u = useTranslations("CatalogView")
  const m = useTranslations("MenuBuilder")
  const locale = useLocale()
  const money = new Intl.NumberFormat(locale, { style: "currency", currency })

  return (
    <section
      className="live-discounts"
      aria-labelledby="discounts-heading"
      role="region"
    >
      <Card>
        <CardHeader className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>
              <h2
                id="discounts-heading"
                className="font-display text-2xl font-bold"
              >
                {t("discountsTitle")}
              </h2>
            </CardTitle>

            <CardDescription className="mt-2">
              {t("discountsDescription")}
            </CardDescription>
          </div>

          <EditorDialog
            sourcePrimary
            icon={Plus}
            title={t("newDiscountCode")}
            label={t("newDiscountCode")}
            description={u("discountEditorHelp")}
          >
            {(callbacks) => (
              <DiscountForm
                tenantId={tenantId}
                currency={currency}
                {...callbacks}
              />
            )}
          </EditorDialog>
        </CardHeader>

        <CardContent className="grid gap-3">
          {discounts.length === 0 ? (
            <p className="py-6 text-muted-foreground">{t("noDiscounts")}</p>
          ) : (
            <>
              <div className="label-mono hidden grid-cols-[1.25fr_.85fr_.7fr_1fr_1fr_.75fr_auto] gap-3 px-3 text-muted-foreground xl:grid">
                <span>{t("discountCode")}</span>

                <span>{t("discountType")}</span>

                <span>{t("discountValueShort")}</span>

                <span>{t("minimumOrderShort", { currency })}</span>

                <span>{t("discountExpiresOn")}</span>

                <span>{m("status")}</span>

                <span className="sr-only">{m("actions")}</span>
              </div>

              <ul className="grid gap-2">
                {discounts.map((discount) => (
                  <li
                    key={discount.id}
                    aria-label={`${discount.code} ${discount.name}`}
                    className={`grid min-w-0 grid-cols-1 items-center gap-3 border bg-background p-3 xl:grid-cols-[1.25fr_.85fr_.7fr_1fr_1fr_.75fr_auto] ${!discount.isActive ? "opacity-60" : ""}`}
                  >
                    <div className="min-w-0">
                      <p className="font-bold break-words">{discount.code}</p>

                      <p className="text-sm break-words text-muted-foreground">
                        {discount.name}
                      </p>
                    </div>

                    <div className="grid gap-1 text-sm xl:block">
                      <span className="label-mono text-muted-foreground xl:hidden">
                        {t("discountType")}
                      </span>

                      <span>
                        {t(
                          discount.kind === "Percentage"
                            ? "percentage"
                            : "fixedAmount"
                        )}
                      </span>
                    </div>

                    <div className="grid gap-1 xl:block">
                      <span className="label-mono text-muted-foreground xl:hidden">
                        {t("discountValueShort")}
                      </span>

                      <span className="tabular-nums">
                        {formatDiscountValue(discount, currency, locale)}
                      </span>
                    </div>

                    <div className="grid gap-1 xl:block">
                      <span className="label-mono text-muted-foreground xl:hidden">
                        {t("minimumOrderShort", { currency })}
                      </span>

                      <span className="tabular-nums">
                        {money.format(discount.minimumOrderAmount)}
                      </span>
                    </div>

                    <div className="grid gap-1 xl:block">
                      <span className="label-mono text-muted-foreground xl:hidden">
                        {t("discountExpiresOn")}
                      </span>

                      <span className="tabular-nums">
                        {discount.expiresOn ?? t("neverExpires")}
                      </span>
                    </div>

                    <Badge variant={discount.isActive ? "success" : "neutral"}>
                      {t(discount.isActive ? "active" : "inactive")}
                    </Badge>

                    {discount.isActive ? (
                      <div className="flex flex-wrap gap-2">
                        <EditorDialog
                          compact
                          title={t("editDiscount", { code: discount.code })}
                          label={u("edit")}
                          description={u("discountEditorHelp")}
                        >
                          {(callbacks) => (
                            <DiscountForm
                              tenantId={tenantId}
                              currency={currency}
                              discount={discount}
                              {...callbacks}
                            />
                          )}
                        </EditorDialog>

                        <DeactivateDiscountButton
                          tenantId={tenantId}
                          id={discount.id}
                          code={discount.code}
                        />
                      </div>
                    ) : (
                      <span />
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

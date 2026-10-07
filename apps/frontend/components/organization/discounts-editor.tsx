"use client"

import { Plus, TicketPercent } from "lucide-react"
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
  const locale = useLocale()

  return (
    <section aria-labelledby="discounts-heading" role="region">
      <Card>
        <CardHeader className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>
              <h2 id="discounts-heading">{t("discountsTitle")}</h2>
            </CardTitle>

            <CardDescription className="mt-2">
              {t("discountsDescription")}
            </CardDescription>
          </div>

          <EditorDialog
            primary
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

        <CardContent>
          {discounts.length === 0 ? (
            <p className="py-6 text-muted-foreground">{t("noDiscounts")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {discounts.map((discount) => (
                <li
                  key={discount.id}
                  aria-label={`${discount.code} ${discount.name}`}
                  className="flex flex-wrap items-center justify-between gap-4 py-5"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <TicketPercent
                      className="mt-1 size-5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />

                    <div className="min-w-0">
                      <h3 className="font-semibold break-words">
                        {discount.code}
                      </h3>

                      <p className="text-sm break-words text-muted-foreground">
                        {discount.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-semibold tabular-nums">
                      {formatDiscountValue(discount, currency, locale)}
                    </span>

                    <Badge variant={discount.isActive ? "success" : "neutral"}>
                      {t(discount.isActive ? "active" : "inactive")}
                    </Badge>

                    {discount.isActive && (
                      <>
                        <EditorDialog
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
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

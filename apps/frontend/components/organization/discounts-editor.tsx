import { useLocale, useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
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
  if (discount.kind === "Percentage")
    return new Intl.NumberFormat(locale, {
      style: "percent",
      maximumFractionDigits: 2,
    }).format(discount.value / 100)

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(discount.value)
}

export function DiscountsEditor({
  tenantId,
  currency,
  discounts,
}: DiscountsEditorProps) {
  const t = useTranslations("Catalog")
  const locale = useLocale()

  return (
    <section aria-labelledby="discounts-heading" role="region">
      <Card>
        <CardHeader>
          <CardTitle>
            <h2 id="discounts-heading" className="text-balance">
              {t("discountsTitle")}
            </h2>
          </CardTitle>

          <CardDescription>{t("discountsDescription")}</CardDescription>
        </CardHeader>

        <CardContent className="grid gap-6">
          <DiscountForm tenantId={tenantId} currency={currency} />

          {discounts.length === 0 ? (
            <p className="text-muted-foreground">{t("noDiscounts")}</p>
          ) : (
            <ul className="grid gap-4">
              {discounts.map((discount) => (
                <li
                  key={discount.id}
                  aria-label={`${discount.code} ${discount.name}`}
                >
                  <Card size="sm">
                    <CardHeader>
                      <CardTitle>
                        <h3 className="text-base">
                          <code className="break-all">{discount.code}</code>
                        </h3>
                      </CardTitle>

                      <CardDescription>
                        <span className="break-words">{discount.name}</span> ·{" "}
                        {formatDiscountValue(discount, currency, locale)}
                      </CardDescription>

                      <Badge
                        variant={discount.isActive ? "default" : "secondary"}
                      >
                        {t(discount.isActive ? "active" : "inactive")}
                      </Badge>
                    </CardHeader>

                    {discount.isActive && (
                      <CardContent className="grid gap-4">
                        <DiscountForm
                          key={`${discount.id}:${discount.name}:${discount.kind}:${discount.value}`}
                          tenantId={tenantId}
                          currency={currency}
                          discount={discount}
                        />

                        <DeactivateDiscountButton
                          tenantId={tenantId}
                          id={discount.id}
                          code={discount.code}
                        />
                      </CardContent>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

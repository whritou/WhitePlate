"use client"

import { Plus } from "lucide-react"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { saveDiscountAction } from "@/actions/catalog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EditorDialog } from "@/components/ui/editor-dialog"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import type {
  CatalogDiscount,
  DiscountsEditorProps,
} from "@/types/catalog-management"
import { DeactivateDiscountButton } from "./deactivate-discount-button"
import { DiscountForm } from "./discount-form"
import { useCatalogForm } from "./use-catalog-form"

export function DiscountsEditor({
  tenantId,
  currency,
  discounts,
}: DiscountsEditorProps) {
  const t = useTranslations("Catalog")
  const u = useTranslations("CatalogView")
  const m = useTranslations("MenuBuilder")

  return (
    <section className="live-discounts" aria-labelledby="discounts-heading">
      <div className="mx-auto max-w-4xl space-y-3">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              id="discounts-heading"
              className="font-display text-2xl font-bold"
            >
              {t("discountsTitle")}
            </h2>

            <p className="text-sm text-muted-foreground">
              {t("discountBuilderDescription")}
            </p>
          </div>

          <EditorDialog
            sourcePrimary
            icon={Plus}
            title={t("newDiscountCode")}
            label={t("addCode")}
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
        </header>

        {discounts.length === 0 ? (
          <p className="py-6 text-muted-foreground">{t("noDiscounts")}</p>
        ) : (
          <>
            <div className="label-mono hidden grid-cols-[1.4fr_1fr_.8fr_.8fr_1.2fr_.8fr_auto_auto] gap-2 px-3 text-muted-foreground xl:grid">
              <span>{t("discountCode")}</span>

              <span>{t("discountTypeShort")}</span>

              <span>{t("discountValueShort")}</span>

              <span>{t("minimumOrderShort", { currency })}</span>

              <span>{t("discountExpiresOn")}</span>

              <span>{m("status")}</span>

              <span className="sr-only">{m("actions")}</span>

              <span className="sr-only">{t("save")}</span>
            </div>

            <ul className="grid gap-2">
              {discounts.map((discount) => (
                <DiscountRow
                  key={discount.id}
                  tenantId={tenantId}
                  discount={discount}
                />
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  )
}

function DiscountRow({
  tenantId,
  discount,
}: {
  tenantId: string
  discount: CatalogDiscount
}) {
  const t = useTranslations("Catalog")
  const [kind, setKind] = useState(discount.kind)
  const { pending, state, submit } = useCatalogForm(saveDiscountAction)
  const active = discount.isActive
  const valueMaximum = kind === "Percentage" ? 100 : 9999999999.99

  return (
    <li
      aria-label={`${discount.code} ${discount.name}`}
      data-testid="discount-row"
      className={`grid min-w-0 grid-cols-1 items-center gap-3 border bg-background p-3 xl:grid-cols-[1.4fr_1fr_.8fr_.8fr_1.2fr_.8fr_auto_auto] ${!active ? "opacity-60" : ""}`}
    >
      <form
        onSubmit={submit}
        aria-label={t("editDiscount", { code: discount.code })}
        className="contents"
      >
        <input type="hidden" name="tenantId" value={tenantId} />

        <input type="hidden" name="id" value={discount.id} />

        <fieldset disabled={!active || pending} className="contents">
          <div className="grid min-w-0 gap-1">
            <Input
              value={discount.code}
              readOnly
              aria-label={t("discountCode")}
              className="border bg-background px-2 font-bold"
            />

            <Input
              name="name"
              defaultValue={discount.name}
              required
              maxLength={120}
              aria-label={t("name")}
              className="h-8 border bg-background px-2 text-xs"
            />
          </div>

          <div className="grid min-w-0 gap-1">
            <span className="label-mono text-muted-foreground xl:hidden">
              {t("discountTypeShort")}
            </span>

            <NativeSelect
              name="kind"
              value={kind}
              onChange={(event) =>
                setKind(event.currentTarget.value as CatalogDiscount["kind"])
              }
              aria-label={t("discountTypeShort")}
              className="w-full"
              selectClassName="w-full"
              required
            >
              <NativeSelectOption value="Percentage">
                {t("percentage")}
              </NativeSelectOption>

              <NativeSelectOption value="FixedAmount">
                {t("fixedAmount")}
              </NativeSelectOption>
            </NativeSelect>
          </div>

          <div className="grid min-w-0 gap-1">
            <span className="label-mono text-muted-foreground xl:hidden">
              {t("discountValueShort")}
            </span>

            <Input
              name="value"
              type="number"
              min="0.01"
              max={valueMaximum}
              step="0.01"
              defaultValue={discount.value}
              aria-label={t("discountValueShort")}
              required
              className="border bg-background px-2"
            />
          </div>

          <div className="grid min-w-0 gap-1">
            <span className="label-mono text-muted-foreground xl:hidden">
              {t("minimumOrderField")}
            </span>

            <Input
              name="minimumOrderAmount"
              type="number"
              min="0"
              max="9999999999.99"
              step="0.01"
              defaultValue={String(discount.minimumOrderAmount)}
              aria-label={t("minimumOrderField")}
              required
              className="border bg-background px-2"
            />
          </div>

          <div className="grid min-w-0 gap-1">
            <span className="label-mono text-muted-foreground xl:hidden">
              {t("discountExpiresOn")}
            </span>

            <Input
              name="expiresOn"
              type="date"
              defaultValue={discount.expiresOn ?? ""}
              aria-label={t("discountExpiresOn")}
              className="border bg-background px-2"
            />
          </div>

          <Badge variant={active ? "success" : "neutral"}>
            {t(active ? "active" : "inactive")}
          </Badge>

          {active ? (
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              aria-label={t("saveDiscount", { code: discount.code })}
              disabled={pending}
            >
              {pending ? t("saving") : t("save")}
            </Button>
          ) : (
            <span />
          )}
        </fieldset>

        {state.status === "error" && (
          <p role="alert" className="text-sm text-destructive xl:col-span-8">
            {t(`errors.${state.error ?? "unavailable"}`)}
          </p>
        )}
      </form>

      {active && (
        <DeactivateDiscountButton
          tenantId={tenantId}
          id={discount.id}
          code={discount.code}
        />
      )}
    </li>
  )
}

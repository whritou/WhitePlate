"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { OrderEmailTemplateField } from "@/components/organization/order-email-template-field"
import { useTranslations } from "next-intl"
import type {
  OrderEmailPlaceholderInsertRequest,
  OrderEmailPlaceholderKey,
  OrderEmailTemplate,
  OrderEmailTemplateFieldKey,
} from "@/types/order-email-settings"
import { orderEmailPlaceholderKeys } from "@/types/order-email-settings"

export function OrderEmailTemplateFields({
  activeTemplate,
  pending,
  onChange,
}: {
  activeTemplate: OrderEmailTemplate | undefined
  pending: boolean
  onChange: (field: keyof OrderEmailTemplate, value: string) => void
}) {
  const t = useTranslations("OrderEmailSettings")
  const placeholderLabels = useMemo<Record<OrderEmailPlaceholderKey, string>>(
    () => ({
      customerName: t("placeholders.customerName"),
      restaurantName: t("placeholders.restaurantName"),
      orderNumber: t("placeholders.orderNumber"),
      orderSummary: t("placeholders.orderSummary"),
      pickupTime: t("placeholders.pickupTime"),
      pickupInstructions: t("placeholders.pickupInstructions"),
      trackingUrl: t("placeholders.trackingUrl"),
    }),
    [t]
  )
  const [activeField, setActiveField] =
    useState<OrderEmailTemplateFieldKey | null>(null)
  const [selectedPlaceholder, setSelectedPlaceholder] = useState<
    OrderEmailPlaceholderKey | ""
  >("")
  const [placeholderLimit, setPlaceholderLimit] = useState(false)
  const [insertRequest, setInsertRequest] =
    useState<OrderEmailPlaceholderInsertRequest>({
      id: 0,
      field: null,
      placeholder: "customerName",
    })

  function requestPlaceholderInsert() {
    if (pending || !activeField || !selectedPlaceholder) return

    setPlaceholderLimit(false)
    setInsertRequest((current) => ({
      id: current.id + 1,
      field: activeField,
      placeholder: selectedPlaceholder,
    }))
  }

  function renderField(field: OrderEmailTemplateFieldKey, label: string) {
    const maxLength = field === "body" ? 2000 : 120

    return (
      <Label className="grid gap-2" htmlFor={`email-template-${field}`}>
        {label}

        <OrderEmailTemplateField
          field={field}
          id={`email-template-${field}`}
          label={label}
          maxLength={maxLength}
          value={activeTemplate?.[field] ?? ""}
          placeholderLabels={placeholderLabels}
          multiline={field === "body"}
          disabled={pending}
          insertRequest={insertRequest}
          onChange={(value) => {
            setPlaceholderLimit(false)
            onChange(field, value)
          }}
          onFocusField={setActiveField}
          onInsertLimit={() => setPlaceholderLimit(true)}
        />
      </Label>
    )
  }

  return (
    <>
      {renderField("subject", t("subject"))}

      {renderField("heading", t("heading"))}

      {renderField("body", t("body"))}

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <Label className="grid gap-2" htmlFor="email-template-placeholder">
          {t("placeholder")}

          <NativeSelect
            id="email-template-placeholder"
            value={selectedPlaceholder}
            disabled={pending}
            aria-describedby="email-template-placeholder-help"
            onChange={(item) =>
              setSelectedPlaceholder(
                item.currentTarget.value as OrderEmailPlaceholderKey | ""
              )
            }
          >
            <NativeSelectOption value="">
              {t("selectPlaceholder")}
            </NativeSelectOption>

            {orderEmailPlaceholderKeys.map((placeholder) => (
              <NativeSelectOption key={placeholder} value={placeholder}>
                {placeholderLabels[placeholder]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Label>

        <Button
          type="button"
          variant="outline"
          disabled={pending || !activeField || !selectedPlaceholder}
          onMouseDown={(item) => item.preventDefault()}
          onClick={requestPlaceholderInsert}
        >
          {t("insert")}
        </Button>
      </div>

      <div className="grid gap-1">
        <p
          id="email-template-placeholder-help"
          className="text-sm text-muted-foreground"
        >
          {t("placeholderHelp")}
        </p>

        {placeholderLimit && (
          <p role="alert" className="text-sm text-destructive">
            {t("placeholderLimit")}
          </p>
        )}
      </div>
    </>
  )
}

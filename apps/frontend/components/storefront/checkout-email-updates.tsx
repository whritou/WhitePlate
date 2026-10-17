"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CheckoutEmailUpdatesProps } from "@/types/checkout"
import { useTranslations } from "next-intl"

export function CheckoutEmailUpdates({
  customerEmail,
  emailUpdatesConsented,
  changeCustomerEmail,
  changeEmailUpdatesConsent,
}: CheckoutEmailUpdatesProps) {
  const c = useTranslations("Checkout")

  return (
    <div className="grid gap-2">
      <Label
        htmlFor="email-updates-consent"
        className="flex min-h-11 items-center gap-3 text-sm font-medium"
      >
        <Checkbox
          id="email-updates-consent"
          checked={emailUpdatesConsented}
          aria-describedby="email-updates-help"
          onCheckedChange={(checked) =>
            changeEmailUpdatesConsent(checked === true)
          }
        />

        {c("emailUpdatesConsent")}
      </Label>

      <p id="email-updates-help" className="text-sm text-muted-foreground">
        {c("emailUpdatesPrivacy")}
      </p>

      {emailUpdatesConsented && (
        <Label className="grid gap-1.5 font-medium" htmlFor="customer-email">
          {c("customerEmail")}

          <Input
            id="customer-email"
            name="customerEmail"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            value={customerEmail}
            onChange={(event) => changeCustomerEmail(event.target.value)}
          />
        </Label>
      )}
    </div>
  )
}

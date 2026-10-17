"use client"

import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import type { CheckoutPickupSelectorProps } from "@/types/checkout"
import { useTranslations } from "next-intl"

export function CheckoutPickupSelector({
  pickupSlots,
  pickupSlotsLoading,
  pickupAvailabilityState,
  selectedPickupAt,
  changePickupAt,
}: CheckoutPickupSelectorProps) {
  const c = useTranslations("Checkout")

  return (
    <>
      <Label className="grid gap-1.5 font-medium" htmlFor="pickup-time">
        {c("pickupTime")}

        <NativeSelect
          id="pickup-time"
          value={selectedPickupAt}
          onChange={(event) => changePickupAt(event.currentTarget.value)}
          disabled={pickupSlotsLoading || pickupSlots.length === 0}
        >
          <NativeSelectOption value="asap">
            {c("asapPickup")}
          </NativeSelectOption>

          {pickupSlots.map((slot) => (
            <NativeSelectOption key={slot.startsAt} value={slot.startsAt}>
              {new Intl.DateTimeFormat(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                timeZone: slot.timeZone,
                timeZoneName: "shortOffset",
              }).format(new Date(slot.startsAt))}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Label>

      {pickupSlots.length === 0 && !pickupSlotsLoading && (
        <p role="status" className="text-sm text-muted-foreground">
          {c(
            pickupAvailabilityState === "orders_paused"
              ? "ordersPaused"
              : pickupAvailabilityState === "schedule_not_configured"
                ? "scheduleNotConfigured"
                : "noPickupSlots"
          )}
        </p>
      )}
    </>
  )
}

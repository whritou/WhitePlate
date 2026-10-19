"use client"

import { Copy } from "@/components/shared/translated-copy"
import {
  SourceInput,
  SourceLabel,
  SourceOption,
  SourceSelect,
} from "@/components/ui/lovable-controls"
import type { CustomerPickupChoicesProps } from "@/types/customer-presentation"

export function CustomerPickupChoices({
  value,
  onChange,
  slots,
  disabled,
  asapDescription,
}: CustomerPickupChoicesProps) {
  return (
    <>
      <SourceLabel className="customer-rounded flex cursor-pointer items-start gap-3 border p-4">
        <SourceInput
          id="pickup-time"
          type="radio"
          name="pickup"
          disabled={disabled}
          checked={value === "asap"}
          onChange={() => onChange("asap")}
          className="mt-1"
        />

        <span>
          <span className="block text-sm font-semibold">
            <Copy>As soon as possible</Copy>
          </span>

          <span className="text-sm text-muted-foreground">
            {asapDescription}
          </span>
        </span>
      </SourceLabel>

      <SourceLabel className="customer-rounded mt-3 flex cursor-pointer items-center gap-3 border p-4">
        <SourceInput
          type="radio"
          name="pickup"
          disabled={disabled}
          checked={value !== "asap"}
          onChange={() => {
            if (slots[0]) onChange(slots[0].value)
          }}
        />

        <span className="text-sm font-semibold">
          <Copy>Choose a time</Copy>
        </span>
      </SourceLabel>

      {value !== "asap" && (
        <SourceLabel className="mt-3 block text-sm">
          <span className="mb-2 block">
            <Copy>Collection time</Copy>
          </span>

          <SourceSelect
            id="scheduled-pickup-time"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            {slots.map((slot) => (
              <SourceOption key={slot.value} value={slot.value}>
                {slot.label}
              </SourceOption>
            ))}
          </SourceSelect>
        </SourceLabel>
      )}
    </>
  )
}

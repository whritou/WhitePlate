"use client"

import { Copy } from "@/components/shared/translated-copy"
import {
  SourceInput,
  SourceLabel,
  SourceTextarea,
} from "@/components/ui/lovable-controls"
import type { CustomerContactFieldsProps } from "@/types/customer-presentation"

export function CustomerContactFields({
  name,
  setName,
  email,
  setEmail,
  phone,
  setPhone,
  notes,
  setNotes,
  emailControls,
}: CustomerContactFieldsProps) {
  return (
    <div className="space-y-4">
      <SourceLabel
        className="customer-contact-field block text-sm font-medium"
        style={{ outline: "none" }}
        htmlFor="customer-name"
      >
        <span className="mb-2 block">
          <Copy>Full name</Copy>
        </span>

        <SourceInput
          id="customer-name"
          name="customerName"
          required
          maxLength={160}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          placeholder="Your name"
        />
      </SourceLabel>

      {emailControls ?? (
        <SourceLabel
          className="block text-sm font-medium"
          htmlFor="customer-email"
        >
          <span className="mb-2 block">
            <Copy>Email</Copy>
          </span>

          <SourceInput
            id="customer-email"
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
          />
        </SourceLabel>
      )}

      <SourceLabel
        className="customer-contact-field block text-sm font-medium"
        style={{ outline: "none" }}
        htmlFor="customer-phone"
      >
        <span className="mb-2 block">
          <Copy>Phone number</Copy>
        </span>

        <SourceInput
          id="customer-phone"
          name="customerPhone"
          required
          type="tel"
          maxLength={40}
          pattern="[0-9+\(\). \-]{3,40}"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          placeholder="Your phone number"
        />
      </SourceLabel>

      <SourceLabel
        className="customer-contact-field block text-sm font-medium"
        style={{ outline: "none" }}
        htmlFor="order-notes"
      >
        <span className="mb-2 block">
          <Copy>Order notes </Copy>
          <span className="font-normal text-muted-foreground">
            <Copy>(optional)</Copy>
          </span>
        </span>

        <SourceTextarea
          id="order-notes"
          name="orderNotes"
          rows={2}
          maxLength={500}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything the kitchen should know?"
        />
      </SourceLabel>
    </div>
  )
}

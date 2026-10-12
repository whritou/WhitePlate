"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { EstablishmentForm } from "@/components/organization/establishment-form"
import { EstablishmentEditor } from "@/components/organization/establishment-editor"
import { Button } from "@/components/ui/button"
import { Receipt } from "@/components/storefront/receipt"
import { parseEstablishmentInput } from "@/lib/validation/establishment-settings"
import type {
  EstablishmentRead,
  EstablishmentSave,
} from "@/types/establishment-settings"

const tenantId = "22222222-2222-4222-8222-222222222222"
const initial: EstablishmentRead = {
  settings: {
    name: "Maison Verte",
    phone: "+33 1 23 45 67 89",
    addressLine1: "12 Rue du Marché",
    addressLine2: null,
    postalCode: "75001",
    city: "Paris",
    region: null,
    countryCode: "FR",
    latitude: 0,
    longitude: 2.123456,
    timeZone: "Europe/Paris",
    pickupScheduling: {
      intervalMinutes: 15,
      minimumLeadMinutes: 20,
      capacity: 8,
    },
    openingHours: null,
    pickupInstructions: {
      en: "Collect at the counter.",
      fr: "Retrait au comptoir.",
    },
    establishmentVersion: 1,
    locales: ["en", "fr"],
    defaultLocale: "fr",
  },
  options: {
    timeZones: ["UTC", "Europe/Paris", "America/New_York"],
    countries: ["FR", "US", "GB", "JP"],
  },
}

export function EstablishmentFixture({ mode }: { mode: string }) {
  const t = useTranslations("LiveWorkspace")
  const [value, setValue] = useState(initial)
  const [calls, setCalls] = useState(0)
  const [lost, setLost] = useState(false)
  const save: EstablishmentSave = async (input) => {
    setCalls((count) => count + 1)
    await new Promise((resolve) => setTimeout(resolve, 600))
    if (mode === "conflict")
      return { ok: false, status: 412, error: "conflict" }
    if (mode === "offline" && calls === 0)
      return { ok: false, status: 503, error: "unavailable" }
    if (mode === "revoked")
      return { ok: false, status: 404, error: "not_found" }

    const parsed = parseEstablishmentInput(input)

    return parsed
      ? {
          ok: true,
          status: 200,
          data: {
            ...value.settings,
            ...parsed,
            establishmentVersion: parsed.establishmentVersion + 1,
          },
        }
      : { ok: false, status: 400, error: "invalid" }
  }

  if (mode === "receipt")
    return (
      <main className="live-page">
        <Receipt
          trackingToken={null}
          receipt={{
            id: tenantId,
            tenantId,
            currency: "EUR",
            customerName: "Guest",
            menuLocale: "fr",
            discountCode: null,
            subtotal: 12,
            discountAmount: 0,
            taxAmount: 1.2,
            total: 13.2,
            status: "Ready",
            version: 1,
            createdAt: "2026-10-12T12:00:00Z",
            pickupAt: "2026-10-12T12:30:00+02:00",
            pickupTimeZone: "Europe/Paris",
            lines: [],
          }}
        />
      </main>
    )

  return (
    <main className="live-page grid min-w-0 gap-6">
      <p className="text-sm text-muted-foreground">Development fixture</p>

      <h1 className="font-display text-4xl font-bold">
        {t("restaurantSettings")}
      </h1>

      {mode === "query" ? (
        <EstablishmentEditor
          tenantId={tenantId}
          userId="fixture-a"
          initial={null}
        />
      ) : lost ? (
        <p role="alert">Access revoked</p>
      ) : (
        <EstablishmentForm
          tenantId={tenantId}
          value={value}
          save={save}
          onSaved={(settings) => setValue({ ...value, settings })}
          onAccessLost={() => setLost(true)}
          reload={async () => {
            const next = {
              ...value,
              settings: {
                ...value.settings,
                name: "Latest saved name",
                establishmentVersion: 2,
                locales: ["fr"],
                pickupInstructions: { fr: "Nouvelle consigne" },
              },
            }

            setValue(next)

            return next
          }}
        />
      )}

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          setValue({
            ...value,
            settings: {
              ...value.settings,
              name: "Background name",
              establishmentVersion: 2,
            },
          })
        }
      >
        Background refresh
      </Button>

      <p data-testid="save-calls">{calls}</p>
    </main>
  )
}

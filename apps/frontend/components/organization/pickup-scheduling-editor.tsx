"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { savePickupSchedulingAction } from "@/actions/establishment-settings"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import type { EstablishmentSettings, PickupSchedulingSettings } from "@/types/establishment-settings"

const defaults: PickupSchedulingSettings = { intervalMinutes: 15, minimumLeadMinutes: 20, capacity: 8 }

export function PickupSchedulingEditor({
  tenantId, initial, onSaved,
}: {
  tenantId: string
  initial: EstablishmentSettings | null
  onSaved: (settings: EstablishmentSettings) => void | Promise<void>
}) {
  const t = useTranslations("PickupScheduling")
  const [settings, setSettings] = useState(initial?.pickupScheduling ?? defaults)
  const [baseline, setBaseline] = useState(initial?.pickupScheduling ?? defaults)
  const [version, setVersion] = useState(initial?.establishmentVersion ?? 0)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()
  const dirty = JSON.stringify(settings) !== JSON.stringify(baseline)

  function save() {
    if (pending || version < 1 || !dirty) return
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await savePickupSchedulingAction({ tenantId, establishmentVersion: version, pickupScheduling: settings })

      if (result.ok && result.data) {
        setSettings(result.data.pickupScheduling)
        setBaseline(result.data.pickupScheduling)
        setVersion(result.data.establishmentVersion)
        setSaved(true)
        await onSaved(result.data)
      } else setError(result.ok ? "unavailable" : result.error)
    })
  }

  return (
    <section className="grid gap-5 border-t pt-6" aria-labelledby="pickup-scheduling-heading">
      <header>
        <h2 id="pickup-scheduling-heading" className="font-display text-2xl font-bold">{t("title")}</h2>

        <p className="mt-2 text-sm text-muted-foreground">{t("description")}</p>
      </header>

      {!initial && <Alert variant="destructive"><AlertDescription>{t("settingsUnavailable")}</AlertDescription></Alert>}

      <div className="grid gap-4 sm:grid-cols-3">
        <Label className="grid gap-2" htmlFor="pickup-interval">
          {t("interval")}

          <NativeSelect id="pickup-interval" value={settings.intervalMinutes} disabled={!initial || pending}
            onChange={(event) => setSettings(current => ({ ...current, intervalMinutes: Number(event.currentTarget.value) as PickupSchedulingSettings["intervalMinutes"] }))}>
            {[10, 15, 20, 30].map(value => <NativeSelectOption key={value} value={value}>{t("minutes", { count: value })}</NativeSelectOption>)}
          </NativeSelect>
        </Label>

        <Label className="grid gap-2" htmlFor="pickup-lead">
          {t("minimumLead")}

          <Input id="pickup-lead" type="number" min={0} max={1440} step={5} value={settings.minimumLeadMinutes}
            disabled={!initial || pending} onChange={event => setSettings(current => ({ ...current, minimumLeadMinutes: Number(event.currentTarget.value) }))} />
        </Label>

        <Label className="grid gap-2" htmlFor="pickup-capacity">
          {t("capacity")}

          <Input id="pickup-capacity" type="number" min={1} max={50} step={1} value={settings.capacity}
            disabled={!initial || pending} onChange={event => setSettings(current => ({ ...current, capacity: Number(event.currentTarget.value) }))} />
        </Label>
      </div>

      <p className="text-sm text-muted-foreground">{t("openingHoursNote")}</p>

      {error && <Alert variant="destructive" role="alert"><AlertDescription>{t("errors." + error)}</AlertDescription></Alert>}

      {saved && <p role="status" className="text-sm font-medium">{t("saved")}</p>}

      <div><Button type="button" onClick={save} disabled={!initial || pending || !dirty}>{pending ? t("saving") : t("save")}</Button></div>
    </section>
  )
}

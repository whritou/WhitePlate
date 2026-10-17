"use client"

import { useState, useTransition } from "react"
import { saveOrderEmailSettingsAction } from "@/actions/order-email-settings"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { OrderEmailPreview } from "@/components/organization/order-email-preview"
import { useTranslations } from "next-intl"
import type {
  OrderEmailEventKey,
  OrderEmailSettings,
  OrderEmailTemplate,
} from "@/types/order-email-settings"

const events: OrderEmailEventKey[] = ["orderCreated", "preparing", "ready"]

export function OrderEmailSettingsEditor({
  tenantId,
  restaurantName,
  initial,
}: {
  tenantId: string
  restaurantName: string
  initial: OrderEmailSettings | null
}) {
  const t = useTranslations("OrderEmailSettings")
  const [settings, setSettings] = useState(initial)
  const [baseline, setBaseline] = useState(initial?.templates ?? [])
  const [locale, setLocale] = useState(initial?.defaultLocale ?? "en")
  const [event, setEvent] = useState<OrderEmailEventKey>("orderCreated")
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()
  const activeLocale = settings?.locales.includes(locale)
    ? locale
    : (settings?.defaultLocale ?? "en")
  const localeTemplates = settings?.templates.find(
    (item) => item.locale === activeLocale
  )
  const activeTemplate = localeTemplates?.[event]
  const dirty = Boolean(
    settings && JSON.stringify(settings.templates) !== JSON.stringify(baseline)
  )
  const valid = Boolean(
    settings?.templates.every((item) =>
      events.every((key) =>
        [item[key].subject, item[key].heading, item[key].body].every(
          (value) => value.trim().length > 0
        )
      )
    )
  )

  function updateTemplate(field: keyof OrderEmailTemplate, value: string) {
    if (!settings) return
    setSaved(false)
    setError(null)
    setSettings((current) => {
      if (!current) return current

      return {
        ...current,
        templates: current.templates.map((item) =>
          item.locale === activeLocale
            ? {
                ...item,
                [event]: { ...item[event], [field]: value },
              }
            : item
        ),
      }
    })
  }

  function resetEvent() {
    const defaults = settings?.defaults.find(
      (item) => item.locale === activeLocale
    )

    if (!settings || !defaults) return
    updateWholeEvent(defaults[event])
  }

  function updateWholeEvent(template: OrderEmailTemplate) {
    if (!settings) return
    setSaved(false)
    setError(null)
    setSettings((current) =>
      current
        ? {
            ...current,
            templates: current.templates.map((item) =>
              item.locale === activeLocale
                ? { ...item, [event]: template }
                : item
            ),
          }
        : current
    )
  }

  function discardChanges() {
    if (!settings) return
    setSettings({ ...settings, templates: baseline })
    setError(null)
    setSaved(false)
  }

  function save() {
    if (!settings || pending || !dirty || !valid) return
    setError(null)
    setSaved(false)
    startTransition(async () => {
      try {
        const result = await saveOrderEmailSettingsAction({
          tenantId,
          version: settings.version,
          templates: settings.templates,
        })

        if (!result.ok || !result.data) {
          setError(result.ok ? "unavailable" : result.error)

          return
        }

        setSettings(result.data)
        setBaseline(result.data.templates)
        setSaved(true)
      } catch {
        setError("unavailable")
      }
    })
  }

  if (!initial || !settings)
    return (
      <Alert variant="destructive">
        <AlertDescription>{t("unavailable")}</AlertDescription>
      </Alert>
    )

  const previewSubject = previewText(
    activeTemplate?.subject ?? "",
    restaurantName
  )
  const previewHeading = previewText(
    activeTemplate?.heading ?? "",
    restaurantName
  )
  const previewBody = previewText(activeTemplate?.body ?? "", restaurantName)

  return (
    <section
      className="grid gap-5"
      aria-labelledby="order-email-settings-heading"
    >
      <header>
        <h2
          id="order-email-settings-heading"
          className="font-display text-2xl font-bold"
        >
          {t("title")}
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">{t("description")}</p>
      </header>

      <Alert variant="info">
        <AlertDescription>{t("senderNote")}</AlertDescription>
      </Alert>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{t("editorTitle")}</CardTitle>

            <CardDescription>{t("editorDescription")}</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Label className="grid gap-2" htmlFor="email-template-locale">
                {t("language")}

                <NativeSelect
                  id="email-template-locale"
                  value={activeLocale}
                  disabled={pending}
                  onChange={(item) => setLocale(item.currentTarget.value)}
                >
                  {settings.locales.map((item) => (
                    <NativeSelectOption key={item} value={item}>
                      {item}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Label>

              <Label className="grid gap-2" htmlFor="email-template-event">
                {t("event")}

                <NativeSelect
                  id="email-template-event"
                  value={event}
                  disabled={pending}
                  onChange={(item) =>
                    setEvent(item.currentTarget.value as OrderEmailEventKey)
                  }
                >
                  {events.map((item) => (
                    <NativeSelectOption key={item} value={item}>
                      {t(`events.${item}`)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Label>
            </div>

            <Label className="grid gap-2" htmlFor="email-template-subject">
              {t("subject")}

              <Input
                id="email-template-subject"
                maxLength={120}
                value={activeTemplate?.subject ?? ""}
                disabled={pending}
                onChange={(item) =>
                  updateTemplate("subject", item.target.value)
                }
              />
            </Label>

            <Label className="grid gap-2" htmlFor="email-template-heading">
              {t("heading")}

              <Input
                id="email-template-heading"
                maxLength={120}
                value={activeTemplate?.heading ?? ""}
                disabled={pending}
                onChange={(item) =>
                  updateTemplate("heading", item.target.value)
                }
              />
            </Label>

            <Label className="grid gap-2" htmlFor="email-template-body">
              {t("body")}

              <Textarea
                id="email-template-body"
                maxLength={2000}
                rows={7}
                value={activeTemplate?.body ?? ""}
                disabled={pending}
                onChange={(item) => updateTemplate("body", item.target.value)}
              />
            </Label>

            <div className="grid gap-1">
              <p className="text-sm font-medium">{t("variables")}</p>

              <p className="text-sm text-muted-foreground">
                <code>
                  {
                    "{{customerName}}, {{restaurantName}}, {{orderNumber}}, {{orderSummary}}, {{pickupTime}}, {{pickupInstructions}}, {{trackingUrl}}"
                  }
                </code>
              </p>
            </div>

            {error && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{t(`errors.${error}`)}</AlertDescription>
              </Alert>
            )}

            {saved && (
              <p role="status" className="text-sm text-foreground">
                {t("saved")}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                disabled={pending || !dirty || !valid}
                onClick={save}
              >
                {pending ? t("saving") : t("save")}
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={pending || !dirty}
                onClick={discardChanges}
              >
                {t("discard")}
              </Button>

              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={resetEvent}
              >
                {t("resetEvent")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <OrderEmailPreview
          restaurantName={restaurantName}
          subject={previewSubject}
          heading={previewHeading}
          body={previewBody}
        />
      </div>
    </section>
  )
}

function previewText(value: string, restaurantName: string) {
  const examples: Record<string, string> = {
    customerName: "Alex",
    restaurantName,
    orderNumber: "A1B2C3D4",
    orderSummary: "2 × Vegetable soup — 20.00 EUR",
    pickupTime: "17 Oct, 12:30",
    pickupInstructions: "Collect at the counter.",
    trackingUrl: "Track order",
  }

  return value.replace(
    /\{\{\s*([A-Za-z]+)\s*\}\}/g,
    (match, key: string) => examples[key] ?? match
  )
}

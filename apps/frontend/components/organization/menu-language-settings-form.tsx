"use client"

import { updateMenuLanguagesAction } from "@/actions/organization"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useRouter } from "@/i18n/navigation"
import type { FormState } from "@/types/catalog"
import { useLocale, useTranslations } from "next-intl"
import { useState, type FormEvent } from "react"

export function MenuLanguageSettingsForm({
  tenantId,
  locales: initialLocales,
  defaultLocale: initialDefaultLocale,
}: {
  tenantId: string
  locales: string[]
  defaultLocale: string
}) {
  const t = useTranslations("Auth")
  const uiLocale = useLocale()
  const router = useRouter()
  const [locales, setLocales] = useState(initialLocales)
  const [defaultLocale, setDefaultLocale] = useState(initialDefaultLocale)
  const [newLocale, setNewLocale] = useState("")
  const [state, setState] = useState<FormState>("idle")

  function addLocale() {
    const locale = newLocale.trim()

    if (
      !locale ||
      locales.some((value) => value.toLowerCase() === locale.toLowerCase())
    )
      return
    setLocales((current) => [...current, locale])
    setNewLocale("")
    if (locales.length === 0) setDefaultLocale(locale)
  }

  function removeLocale(locale: string) {
    if (locales.length <= 1) return

    const next = locales.filter((value) => value !== locale)

    setLocales(next)
    if (defaultLocale === locale) setDefaultLocale(next[0]!)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState("pending")

    const result = await updateMenuLanguagesAction({
      tenantId,
      locales,
      defaultLocale,
    }).catch(() => ({ ok: false as const }))

    if (result.ok) {
      setState("success")
      router.refresh()
    } else setState("error")
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="grid gap-6">
      <div className="grid gap-3">
        <h2 className="text-base font-semibold">{t("menuLanguagesEnabled")}</h2>

        <RadioGroup
          aria-label={t("defaultMenuLanguage")}
          disabled={state === "pending"}
          name="default-locale"
          value={defaultLocale}
          onValueChange={(value) => setDefaultLocale(String(value))}
          render={<ul />}
          className="divide-y divide-border rounded-lg border border-border"
        >
          {locales.map((locale) => (
            <li
              key={locale}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <Label className="flex min-w-0 items-center gap-3 text-sm">
                <RadioGroupItem
                  value={locale}
                  aria-label={languageName(locale, uiLocale)}
                />

                <span>
                  <span className="font-medium">
                    {languageName(locale, uiLocale)}
                  </span>

                  <span className="ml-2 text-muted-foreground">{locale}</span>
                </span>

                {defaultLocale === locale && (
                  <Badge variant="secondary" className="rounded-full">
                    {t("defaultMenuLanguage")}
                  </Badge>
                )}
              </Label>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={state === "pending" || locales.length <= 1}
                onClick={() => removeLocale(locale)}
                aria-label={`${t("removeMenuLanguage")} ${locale}`}
              >
                {t("removeMenuLanguage")}
              </Button>
            </li>
          ))}
        </RadioGroup>

        <p className="text-sm text-muted-foreground">
          {t("menuLanguagesHint")}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
        <Label
          className="grid gap-2 text-sm font-medium"
          htmlFor="new-menu-locale"
        >
          {t("addMenuLanguage")}

          <Input
            id="new-menu-locale"
            disabled={state === "pending"}
            value={newLocale}
            onChange={(event) => setNewLocale(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                addLocale()
              }
            }}
            placeholder="fr-CA"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </Label>

        <Button
          type="button"
          variant="outline"
          disabled={state === "pending"}
          onClick={addLocale}
        >
          {t("addLanguageAction")}
        </Button>
      </div>

      {state === "success" && (
        <p role="status" className="text-sm text-foreground">
          {t("menuLanguagesSaved")}
        </p>
      )}

      {state === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {t("menuLanguagesError")}
        </p>
      )}

      <Button type="submit" disabled={state === "pending"} className="w-fit">
        {state === "pending"
          ? t("savingMenuLanguages")
          : t("saveMenuLanguages")}
      </Button>
    </form>
  )
}

function languageName(locale: string, uiLocale: string) {
  try {
    const displayNames = new Intl.DisplayNames([uiLocale], { type: "language" })

    return displayNames.of(locale) ?? locale
  } catch {
    return locale
  }
}

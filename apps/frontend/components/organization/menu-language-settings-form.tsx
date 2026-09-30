"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "@/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { updateMenuLanguagesAction } from "@/lib/organization-actions"

type FormState = "idle" | "pending" | "success" | "error"

export function MenuLanguageSettingsForm({ tenantId, locales: initialLocales, defaultLocale: initialDefaultLocale }: {
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
    if (!locale || locales.some((value) => value.toLowerCase() === locale.toLowerCase())) return
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
    const result = await updateMenuLanguagesAction({ tenantId, locales, defaultLocale })
    if (result.ok) {
      setState("success")
      router.refresh()
    } else setState("error")
  }

  return <form onSubmit={(event) => void submit(event)} className="grid gap-6">
    <div className="grid gap-3">
      <h2 className="text-base font-semibold">{t("menuLanguagesEnabled")}</h2>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {locales.map((locale) => <li key={locale} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <label className="flex min-w-0 items-center gap-3 text-sm">
            <input type="radio" name="default-locale" value={locale} checked={defaultLocale === locale}
              onChange={() => setDefaultLocale(locale)} className="size-4 accent-primary" />
            <span><span className="font-medium">{languageName(locale, uiLocale)}</span><span className="ml-2 text-muted-foreground">{locale}</span></span>
            {defaultLocale === locale && <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{t("defaultMenuLanguage")}</span>}
          </label>
          <Button type="button" variant="ghost" size="sm" disabled={locales.length <= 1}
            onClick={() => removeLocale(locale)} aria-label={`${t("removeMenuLanguage")} ${locale}`}>
            {t("removeMenuLanguage")}
          </Button>
        </li>)}
      </ul>
      <p className="text-sm text-muted-foreground">{t("menuLanguagesHint")}</p>
    </div>

    <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
      <label className="grid gap-2 text-sm font-medium" htmlFor="new-menu-locale">{t("addMenuLanguage")}
        <input id="new-menu-locale" value={newLocale} onChange={(event) => setNewLocale(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addLocale() } }}
          placeholder="fr-CA" autoCapitalize="off" autoCorrect="off" spellCheck={false}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/30" />
      </label>
      <Button type="button" variant="outline" onClick={addLocale}>{t("addLanguageAction")}</Button>
    </div>

    {state === "success" && <p role="status" className="text-sm text-foreground">{t("menuLanguagesSaved")}</p>}
    {state === "error" && <p role="alert" className="text-sm text-destructive">{t("menuLanguagesError")}</p>}
    <Button type="submit" disabled={state === "pending"} className="w-fit">
      {state === "pending" ? t("savingMenuLanguages") : t("saveMenuLanguages")}
    </Button>
  </form>
}

function languageName(locale: string, uiLocale: string) {
  try {
    const displayNames = new Intl.DisplayNames([uiLocale], { type: "language" })
    return displayNames.of(locale) ?? locale
  } catch {
    return locale
  }
}

"use client"

import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { saveCatalogTranslationAction } from "@/lib/organization-actions"

type LocalizedText = { name: string; description: string | null }
type TranslationRow = {
  id: string
  type: "categories" | "products" | "option-groups" | "options"
  label: string
  name: string
  description: string | null
  translations: Record<string, LocalizedText>
  isArchived: boolean
}

export type CatalogTranslationData = {
  categories: { id: string; name: string; isArchived: boolean; translations: Record<string, LocalizedText> }[]
  products: { id: string; categoryId: string; name: string; description: string | null; isArchived: boolean; translations: Record<string, LocalizedText> }[]
  optionGroups: { id: string; productId: string; name: string; isArchived: boolean; translations: Record<string, LocalizedText> }[]
  options: { id: string; groupId: string; name: string; isArchived: boolean; translations: Record<string, LocalizedText> }[]
}

export function CatalogTranslationsEditor({ tenantId, locales, defaultLocale, catalog }: {
  tenantId: string
  locales: string[]
  defaultLocale: string
  catalog: CatalogTranslationData
}) {
  const t = useTranslations("Auth")
  const uiLocale = useLocale()
  const [locale, setLocale] = useState(defaultLocale)
  const rows: TranslationRow[] = [
    ...catalog.categories.map((item) => ({ ...item, type: "categories" as const, label: t("menuCategory"), description: null })),
    ...catalog.products.map((item) => ({ ...item, type: "products" as const, label: t("menuProduct") })),
    ...catalog.optionGroups.map((item) => ({ ...item, type: "option-groups" as const, label: t("menuOptionGroup"), description: null })),
    ...catalog.options.map((item) => ({ ...item, type: "options" as const, label: t("menuOption"), description: null })),
  ].filter((item) => !item.isArchived)
  const displayNames = new Intl.DisplayNames([uiLocale], { type: "language" })

  return <section className="mt-10 border-t border-border pt-8">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h2 className="text-xl font-semibold tracking-tight">{t("menuTranslationsTitle")}</h2>
        <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">{t("menuTranslationsDescription")}</p>
      </div>
      <label className="grid gap-1.5 text-xs font-medium text-muted-foreground" htmlFor="translation-locale">{t("editLanguage")}
        <select id="translation-locale" value={locale} onChange={(event) => setLocale(event.target.value)}
          className="h-9 min-w-44 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/30">
          {locales.map((value) => <option key={value} value={value}>{languageName(displayNames, value)} ({value})</option>)}
        </select>
      </label>
    </div>
    {rows.length === 0 ? <p className="mt-5 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">{t("noCatalogTranslations")}</p> :
      <ul className="mt-5 divide-y divide-border rounded-lg border border-border">
        {rows.map((row) => {
          const text = row.translations[locale] ?? row.translations[defaultLocale]
          return <li key={`${locale}-${row.type}-${row.id}`} className="p-4 sm:p-5">
            <CatalogTranslationRow tenantId={tenantId} row={row} locale={locale}
              initialName={text?.name ?? row.name} initialDescription={text?.description ?? row.description}
              label={row.label} />
          </li>
        })}
      </ul>}
  </section>
}

function CatalogTranslationRow({ tenantId, row, locale, initialName, initialDescription, label }: {
  tenantId: string
  row: TranslationRow
  locale: string
  initialName: string
  initialDescription: string | null
  label: string
}) {
  const t = useTranslations("Auth")
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription ?? "")
  const [state, setState] = useState<"idle" | "pending" | "success" | "error">("idle")

  async function save() {
    setState("pending")
    const result = await saveCatalogTranslationAction({ tenantId, entityType: row.type, entityId: row.id,
      locale, name, description: row.type === "products" ? description : null })
    setState(result.ok ? "success" : "error")
  }

  return <div className="grid gap-3">
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-sm bg-muted px-2 py-0.5 text-xs text-muted-foreground">{label}</span>
      <h3 className="font-medium">{row.name}</h3>
    </div>
    <label className="grid gap-1.5 text-sm font-medium">{t("translatedName")}
      <input value={name} onChange={(event) => { setName(event.target.value); setState("idle") }}
        maxLength={row.type === "products" ? 160 : 120} required
        className="h-9 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/30" />
    </label>
    {row.type === "products" && <label className="grid gap-1.5 text-sm font-medium">{t("translatedDescription")}
      <textarea value={description} onChange={(event) => { setDescription(event.target.value); setState("idle") }}
        maxLength={1000} rows={2} className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/30" />
    </label>}
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" variant="outline" size="sm" onClick={() => void save()} disabled={state === "pending"}>
        {state === "pending" ? t("savingTranslation") : t("saveTranslation")}
      </Button>
      {state === "success" && <p role="status" className="text-sm text-foreground">{t("translationSaved")}</p>}
      {state === "error" && <p role="alert" className="text-sm text-destructive">{t("translationError")}</p>}
    </div>
  </div>
}

function languageName(names: Intl.DisplayNames, locale: string) {
  try {
    return names.of(locale) ?? locale
  } catch {
    return locale
  }
}

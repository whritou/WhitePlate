"use client"

import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { CatalogTranslationRow } from "@/components/organization/catalog-translation-row"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import type { TranslationRow, CatalogTranslationData } from "@/types/catalog"

export function CatalogTranslationsEditor({
  tenantId,
  locales,
  defaultLocale,
  catalog,
}: {
  tenantId: string
  locales: string[]
  defaultLocale: string
  catalog: CatalogTranslationData
}) {
  const t = useTranslations("Auth")
  const uiLocale = useLocale()
  const [locale, setLocale] = useState(defaultLocale)
  const rows: TranslationRow[] = [
    ...catalog.categories.map((item) => ({
      ...item,
      type: "categories" as const,
      label: t("menuCategory"),
      description: null,
    })),
    ...catalog.products.map((item) => ({
      ...item,
      type: "products" as const,
      label: t("menuProduct"),
    })),
    ...catalog.optionGroups.map((item) => ({
      ...item,
      type: "option-groups" as const,
      label: t("menuOptionGroup"),
      description: null,
    })),
    ...catalog.options.map((item) => ({
      ...item,
      type: "options" as const,
      label: t("menuOption"),
      description: null,
    })),
  ].filter((item) => !item.isArchived)
  const displayNames = new Intl.DisplayNames([uiLocale], { type: "language" })

  return (
    <section className="mt-10 border-t border-border pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {t("menuTranslationsTitle")}
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
            {t("menuTranslationsDescription")}
          </p>
        </div>
        <Label
          className="grid gap-1.5 text-xs font-medium text-muted-foreground"
          htmlFor="translation-locale"
        >
          {t("editLanguage")}
          <NativeSelect
            id="translation-locale"
            value={locale}
            onChange={(event) => setLocale(event.target.value)}
            className="w-full"
            selectClassName="h-9 min-w-44 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            {locales.map((value) => (
              <NativeSelectOption key={value} value={value}>
                {languageName(displayNames, value)} ({value})
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Label>
      </div>
      {rows.length === 0 ? (
        <p className="mt-5 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
          {t("noCatalogTranslations")}
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-border rounded-lg border border-border">
          {rows.map((row) => {
            const text =
              row.translations[locale] ?? row.translations[defaultLocale]
            return (
              <li
                key={`${locale}-${row.type}-${row.id}`}
                className="p-4 sm:p-5"
              >
                <CatalogTranslationRow
                  tenantId={tenantId}
                  row={row}
                  locale={locale}
                  initialName={text?.name ?? row.name}
                  initialDescription={text?.description ?? row.description}
                  label={row.label}
                />
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function languageName(names: Intl.DisplayNames, locale: string) {
  try {
    return names.of(locale) ?? locale
  } catch {
    return locale
  }
}

"use client"

import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { Search } from "lucide-react"
import { CatalogTranslationRow } from "./catalog-translation-row"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import type { CatalogTranslationData, TranslationRow } from "@/types/catalog"

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
  const u = useTranslations("MenuTranslations")
  const uiLocale = useLocale()
  const [chosenLocale, setLocale] = useState(defaultLocale)
  const [search, setSearch] = useState("")
  const [kind, setKind] = useState("all")
  const [status, setStatus] = useState("all")
  const locale = locales.includes(chosenLocale) ? chosenLocale : defaultLocale
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
  const visible = rows.filter(
    (row) =>
      (kind === "all" || row.type === kind) &&
      (status === "all" ||
        (status === "missing"
          ? !row.translations[locale]
          : !!row.translations[locale])) &&
      (row.name + " " + (row.translations[locale]?.name ?? ""))
        .toLocaleLowerCase()
        .includes(search.trim().toLocaleLowerCase())
  )
  const names = new Intl.DisplayNames([uiLocale], { type: "language" })

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <CardTitle>
            <h2>{t("menuTranslationsTitle")}</h2>
          </CardTitle>

          <CardDescription className="mt-2 max-w-[36rem]">
            {t("menuTranslationsDescription")}
          </CardDescription>
        </div>

        <div className="grid w-full gap-2 sm:w-auto">
          <Label htmlFor="translation-locale">{t("editLanguage")}</Label>

          <NativeSelect
            id="translation-locale"
            value={locale}
            onChange={(event) => setLocale(event.target.value)}
            selectClassName="w-full sm:min-w-48"
          >
            {locales.map((value) => (
              <NativeSelectOption key={value} value={value}>
                {names.of(value) ?? value} ({value})
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </CardHeader>

      <CardContent className="grid gap-5">
        <div className="grid gap-4 border-b border-border pb-5 md:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div className="grid gap-2">
            <Label htmlFor="translation-search">{u("search")}</Label>

            <div className="relative">
              <Search
                aria-hidden="true"
                className="absolute top-3 left-3 size-5 text-muted-foreground"
              />

              <Input
                id="translation-search"
                className="pl-10"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={u("searchPlaceholder")}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="translation-kind">{u("type")}</Label>

            <NativeSelect
              id="translation-kind"
              value={kind}
              onChange={(event) => setKind(event.target.value)}
              selectClassName="w-full"
            >
              <NativeSelectOption value="all">
                {u("allTypes")}
              </NativeSelectOption>

              {(
                ["categories", "products", "option-groups", "options"] as const
              ).map((value, index) => (
                <NativeSelectOption key={value} value={value}>
                  {t(
                    [
                      "menuCategory",
                      "menuProduct",
                      "menuOptionGroup",
                      "menuOption",
                    ][index]
                  )}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="translation-status">{u("status")}</Label>

            <NativeSelect
              id="translation-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              selectClassName="w-full"
            >
              <NativeSelectOption value="all">
                {u("allStatuses")}
              </NativeSelectOption>

              <NativeSelectOption value="missing">
                {u("missing")}
              </NativeSelectOption>

              <NativeSelectOption value="translated">
                {u("translated")}
              </NativeSelectOption>
            </NativeSelect>
          </div>
        </div>

        <p role="status" className="text-sm text-muted-foreground">
          {u("progress", {
            count: rows.filter((row) => !!row.translations[locale]).length,
            total: rows.length,
          })}
        </p>

        {visible.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            {rows.length === 0 ? t("noCatalogTranslations") : u("noResults")}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((row) => {
              const text =
                row.translations[locale] ?? row.translations[defaultLocale]

              return (
                <li key={`${locale}-${row.type}-${row.id}`} className="py-5">
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
      </CardContent>
    </Card>
  )
}

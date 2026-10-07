"use client"

import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { EditorDialog } from "@/components/ui/editor-dialog"
import type { TranslationRow } from "@/types/catalog"
import { CatalogTranslationForm } from "./catalog-translation-form"

export function CatalogTranslationRow({
  tenantId,
  row,
  locale,
  initialName,
  initialDescription,
  label,
}: {
  tenantId: string
  row: TranslationRow
  locale: string
  initialName: string
  initialDescription: string | null
  label: string
}) {
  const t = useTranslations("MenuTranslations")
  const saved = row.translations[locale]

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <p className="mb-1 text-sm text-muted-foreground">{label}</p>

        <h3 className="font-semibold break-words">{row.name}</h3>

        {row.description && (
          <p className="mt-1 text-sm break-words text-muted-foreground">
            {row.description}
          </p>
        )}
      </div>

      <div className="min-w-0">
        <Badge variant={saved ? "success" : "warning"}>
          {t(saved ? "translated" : "missing")}
        </Badge>

        {saved ? (
          <div lang={locale} className="mt-2 break-words">
            <p className="font-medium">{saved.name}</p>

            {saved.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {saved.description}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            {t("fallbackNotice")}
          </p>
        )}
      </div>

      <div>
        <EditorDialog
          title={t("editTitle", { name: row.name, locale })}
          label={t(saved ? "edit" : "add")}
          description={t("editorHelp", { locale })}
        >
          {(callbacks) => (
            <CatalogTranslationForm
              tenantId={tenantId}
              row={row}
              locale={locale}
              initialName={initialName}
              initialDescription={initialDescription}
              {...callbacks}
            />
          )}
        </EditorDialog>
      </div>
    </div>
  )
}

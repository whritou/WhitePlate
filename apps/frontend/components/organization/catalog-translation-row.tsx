"use client"

import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { EditorDialog } from "@/components/ui/editor-dialog"
import { TableCell, TableRow } from "@/components/ui/table"
import type { TranslationRow } from "@/types/catalog"
import { CatalogTranslationForm } from "./catalog-translation-form"

export function CatalogTranslationRow({
  tenantId,
  row,
  locale,
  initialName,
  initialDescription,
  label,
  readOnly,
  onPendingChange,
}: {
  tenantId: string
  row: TranslationRow
  locale: string
  initialName: string
  initialDescription: string | null
  label: string
  readOnly?: boolean
  onPendingChange?: (pending: boolean) => void
}) {
  const t = useTranslations("MenuTranslations")
  const saved = row.translations[locale]

  return (
    <TableRow>
      <TableCell className="min-w-40 align-top">
        <p className="mb-1 text-xs text-muted-foreground">{label}</p>

        <h3 className="font-semibold break-words">{row.name}</h3>

        {row.description && (
          <p className="mt-1 text-sm break-words whitespace-pre-wrap text-muted-foreground">
            {row.description}
          </p>
        )}
      </TableCell>

      <TableCell className="min-w-40 align-top">
        {saved ? (
          <div lang={locale} className="break-words">
            <p className="font-medium">{saved.name}</p>

            {saved.description && (
              <p className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">
                {saved.description}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("fallbackNotice")}</p>
        )}
      </TableCell>

      <TableCell className="align-top">
        <Badge variant={saved ? "success" : "warning"}>
          {t(saved ? "translated" : "missing")}
        </Badge>
      </TableCell>

      <TableCell className="align-top">
        {!readOnly && (
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
                onPendingChange={(value) => {
                  callbacks.onPendingChange?.(value)
                  onPendingChange?.(value)
                }}
              />
            )}
          </EditorDialog>
        )}
      </TableCell>
    </TableRow>
  )
}

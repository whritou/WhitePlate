"use client"

import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { EditorDialog } from "@/components/ui/editor-dialog"
import { TableCell, TableRow } from "@/components/ui/table"
import type { TranslationRow } from "@/types/catalog"
import type {
  CatalogTranslationReview,
  CatalogTranslationReviewStatus,
} from "@/types/catalog-translation-workflow"
import { CatalogTranslationForm } from "./catalog-translation-form"
import { CatalogTranslationReviewActions } from "./catalog-translation-review-actions"

export function CatalogTranslationRow({
  tenantId,
  row,
  locale,
  initialName,
  initialDescription,
  label,
  review,
  readOnly,
  onPendingChange,
}: {
  tenantId: string
  row: TranslationRow
  locale: string
  initialName: string
  initialDescription: string | null
  label: string
  review?: CatalogTranslationReview
  readOnly?: boolean
  onPendingChange?: (pending: boolean) => void
}) {
  const t = useTranslations("MenuTranslations")
  const saved = row.translations[locale]
  const reviewForLocale = review?.locale === locale ? review : undefined
  const reviewLabel: Record<CatalogTranslationReviewStatus, string> = {
    Pending: t("reviewPending"),
    Approved: t("reviewApproved"),
    Rejected: t("reviewRejected"),
    Stale: t("reviewStale"),
    Superseded: t("reviewSuperseded"),
  }
  const reviewVariant =
    reviewForLocale?.status === "Approved"
      ? "success"
      : reviewForLocale?.status === "Rejected"
        ? "destructive"
        : reviewForLocale?.status === "Superseded"
          ? "neutral"
          : "warning"

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

        {reviewForLocale && (
          <div className="mt-3 grid gap-2 rounded-md border border-border bg-muted p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-muted-foreground">
                {t("reviewCandidate")}
              </p>

              <Badge variant={reviewVariant}>
                {reviewLabel[reviewForLocale.status]}
              </Badge>
            </div>

            <div lang={locale} className="break-words">
              <p className="font-medium">{reviewForLocale.name}</p>

              {reviewForLocale.description && (
                <p className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">
                  {reviewForLocale.description}
                </p>
              )}
            </div>

            {reviewForLocale.glossaryWarnings.map((term) => (
              <p key={term} className="text-sm text-warning">
                {t("reviewWarning", { term })}
              </p>
            ))}
          </div>
        )}
      </TableCell>

      <TableCell className="align-top">
        <div className="grid justify-items-start gap-2">
          <Badge variant={saved ? "success" : "warning"}>
            {t(saved ? "translated" : "missing")}
          </Badge>

          {reviewForLocale && reviewForLocale.status !== "Pending" && (
            <Badge variant={reviewVariant}>
              {reviewLabel[reviewForLocale.status]}
            </Badge>
          )}
        </div>
      </TableCell>

      <TableCell className="align-top">
        {reviewForLocale?.status === "Pending" && (
          <CatalogTranslationReviewActions
            tenantId={tenantId}
            review={reviewForLocale}
            onPendingChange={onPendingChange}
          />
        )}

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
                initialName={
                  reviewForLocale?.status === "Pending"
                    ? reviewForLocale.name
                    : initialName
                }
                initialDescription={
                  reviewForLocale?.status === "Pending"
                    ? reviewForLocale.description
                    : initialDescription
                }
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

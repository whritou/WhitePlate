"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { useLocale, useTranslations } from "next-intl"
import {
  fetchCatalogHistory,
  CatalogHistoryRequestError,
} from "@/lib/api/catalog-publication-browser"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import type {
  CatalogChange,
  CatalogHistoryRevision,
} from "@/types/catalog-management"

const HISTORY_PAGE_SIZE = 25

export function CatalogChangesDialog({
  open,
  onOpenChange,
  changes,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  changes: CatalogChange[]
}) {
  const t = useTranslations("CatalogPublication")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">
        <div className="flex items-start justify-between gap-4 border-b p-5">
          <div className="grid gap-1">
            <DialogTitle className="font-heading text-xl font-semibold">
              {t("changesTitle")}
            </DialogTitle>

            <DialogDescription className="text-sm text-muted-foreground">
              {t("changesDescription")}
            </DialogDescription>
          </div>

          <DialogClose render={<Button type="button" variant="outline" />}>
            {t("close")}
          </DialogClose>
        </div>

        <div className="grid max-h-[70dvh] gap-4 overflow-y-auto p-5">
          <CatalogChangeList changes={changes} emptyMessage={t("noChanges")} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function CatalogHistoryList({
  tenantId,
  userId,
  currentVersion,
  disabled,
  onRestore,
}: {
  tenantId: string
  userId?: string
  currentVersion: number
  disabled: boolean
  onRestore: (version: number) => void
}) {
  const t = useTranslations("CatalogPublication")
  const locale = useLocale()
  const query = useInfiniteQuery({
    queryKey: ["catalog-history", userId, tenantId, locale],
    queryFn: ({ pageParam, signal }) =>
      fetchCatalogHistory(tenantId, pageParam, signal),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) =>
      lastPage.revisions.length === HISTORY_PAGE_SIZE
        ? lastPage.revisions.at(-1)?.version
        : undefined,
    retry: false,
  })
  const revisions = query.data?.pages.flatMap((page) => page.revisions) ?? []
  const denied =
    query.error instanceof CatalogHistoryRequestError &&
    ["unauthorized", "forbidden", "not_found"].includes(query.error.code)

  return (
    <section aria-labelledby="catalog-history-title" className="grid gap-4">
      <div className="grid gap-1">
        <h2
          id="catalog-history-title"
          className="font-heading text-xl font-semibold"
        >
          {t("historyTitle")}
        </h2>

        <p className="text-sm text-muted-foreground">
          {t("historyDescription")}
        </p>
      </div>

      <div className="grid gap-4">
        {query.isPending ? (
          <p role="status">{t("loading")}</p>
        ) : denied ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{t("accessLost")}</AlertDescription>
          </Alert>
        ) : query.isError ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{t("historyFailed")}</AlertDescription>

            <Button
              type="button"
              variant="outline"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              {t("retry")}
            </Button>
          </Alert>
        ) : revisions.length === 0 ? (
          <p>{t("noHistory")}</p>
        ) : (
          <div className="grid gap-4">
            <ol className="grid gap-3">
              {revisions.map((revision) => (
                <HistoryEntry
                  key={revision.version}
                  revision={revision}
                  currentVersion={currentVersion}
                  disabled={disabled}
                  onRestore={onRestore}
                />
              ))}
            </ol>

            {query.hasNextPage && (
              <Button
                type="button"
                variant="outline"
                disabled={query.isFetchingNextPage}
                onClick={() => void query.fetchNextPage()}
              >
                {query.isFetchingNextPage ? t("loading") : t("loadOlder")}
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function HistoryEntry({
  revision,
  currentVersion,
  disabled,
  onRestore,
}: {
  revision: CatalogHistoryRevision
  currentVersion: number
  disabled: boolean
  onRestore: (version: number) => void
}) {
  const t = useTranslations("CatalogPublication")
  const locale = useLocale()
  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(revision.publishedAt))

  return (
    <li className="grid gap-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h3 className="font-heading font-semibold">
            {t("version", { version: revision.version })}
          </h3>

          <p className="text-sm text-muted-foreground">
            <time dateTime={revision.publishedAt}>{date}</time>

            {" · "}

            {t("changedBy", {
              actor: `${revision.actorSubject} (${revision.actorIssuer})`,
            })}
          </p>

          <Badge
            variant={revision.action === "baseline" ? "neutral" : "success"}
          >
            {t(`actions.${revision.action}`, {
              sourceVersion: revision.sourceVersion ?? 0,
            })}
          </Badge>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || revision.version === currentVersion}
          onClick={() => onRestore(revision.version)}
        >
          {t("restore")}
        </Button>
      </div>

      <CatalogChangeList
        changes={revision.changes}
        emptyMessage={t("noRevisionChanges")}
      />
    </li>
  )
}

function CatalogChangeList({
  changes,
  emptyMessage,
}: {
  changes: CatalogChange[]
  emptyMessage: string
}) {
  const t = useTranslations("CatalogPublication")

  if (changes.length === 0)
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>

  return (
    <ul className="grid gap-3">
      {changes.map((change, index) => (
        <li
          key={`${change.entityType}:${change.entityId}:${index}`}
          className="grid gap-1 border-b pb-3 last:border-0 last:pb-0"
        >
          <p className="font-medium">
            {change.name}{" "}
            <span className="text-muted-foreground">
              · {t(`changeActions.${change.action}`)}
            </span>
          </p>

          {change.fields.length > 0 && (
            <ul className="grid gap-1 pl-4 text-sm text-muted-foreground">
              {change.fields.map((field) => (
                <li key={field.field} className="break-words">
                  <span className="font-medium text-foreground">
                    {t(`fields.${field.field}`, { defaultValue: field.field })}
                  </span>

                  {": "}

                  {formatChangeValue(field.before, t("emptyValue"))}

                  {" → "}

                  {formatChangeValue(field.after, t("emptyValue"))}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )
}

function formatChangeValue(value: string | null, empty: string): string {
  if (value === null) return empty

  try {
    const parsed: unknown = JSON.parse(value)

    if (typeof parsed === "string") return parsed
    if (typeof parsed === "number" || typeof parsed === "boolean")
      return String(parsed)
    if (Array.isArray(parsed)) return parsed.map(String).join(", ") || empty
    if (parsed && typeof parsed === "object") return JSON.stringify(parsed)

    return empty
  } catch {
    return value
  }
}

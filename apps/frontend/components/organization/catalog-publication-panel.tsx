"use client"

import { useState } from "react"
import { History, LoaderCircle, RotateCcw, Upload } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import {
  discardCatalogDraftAction,
  publishCatalogAction,
  restoreCatalogVersionAction,
} from "@/actions/catalog-publication"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  CatalogChangesDialog,
  CatalogHistoryDialog,
} from "./catalog-publication-dialogs"
import { CatalogPublicationConfirmation } from "./catalog-publication-confirmation"
import type {
  CatalogPublicationSummary,
  PublicationConfirmAction,
  CatalogResult,
} from "@/types/catalog-management"

export function CatalogPublicationPanel({
  tenantId,
  userId,
  publication,
  pending,
}: {
  tenantId: string
  userId?: string
  publication: CatalogPublicationSummary | null
  pending: boolean
}) {
  const t = useTranslations("CatalogPublication")
  const locale = useLocale()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [panel, setPanel] = useState<"changes" | "history" | null>(null)
  const [confirmation, setConfirmation] =
    useState<PublicationConfirmAction | null>(null)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<
    Extract<CatalogResult, { ok: false }>["error"] | null
  >(null)
  const [success, setSuccess] = useState<string | null>(null)
  const hasChanges = publication?.hasUnpublishedChanges ?? false
  const disabled = pending || working || !publication

  async function confirmAction() {
    if (!confirmation || !publication || working || pending) return

    setWorking(true)
    setError(null)
    setSuccess(null)

    try {
      const base = { tenantId, expectedVersion: publication.publishedVersion }
      let result: CatalogResult
      let message: string

      if (confirmation.kind === "publish") {
        result = await publishCatalogAction(base)
        message = "published"
      } else if (confirmation.kind === "discard") {
        result = await discardCatalogDraftAction(base)
        message = "discarded"
      } else {
        result = await restoreCatalogVersionAction({
          ...base,
          sourceVersion: confirmation.version,
        })
        message = "restored"
      }

      if (!result.ok) {
        setError(result.error)
        setConfirmation(null)
        if (result.error === "conflict") router.refresh()

        return
      }

      setSuccess(message)
      setConfirmation(null)
      setPanel(null)
      await queryClient.invalidateQueries({
        queryKey: ["catalog-history", userId, tenantId],
      })
      router.refresh()
    } catch {
      setError("unavailable")
    } finally {
      setWorking(false)
    }
  }

  const formattedDate = publication
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(publication.publishedAt))
    : null

  return (
    <>
      <Card aria-busy={working || pending}>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <CardHeader className="flex min-w-0 flex-row items-start gap-3 p-0">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <Upload aria-hidden="true" className="size-5" />
            </span>

            <div className="grid min-w-0 gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base">
                  <h2>
                    {publication
                      ? t("publishedVersion", {
                          version: publication.publishedVersion,
                        })
                      : t("unavailableTitle")}
                  </h2>
                </CardTitle>

                <Badge variant={hasChanges ? "warning" : "success"}>
                  {hasChanges ? t("draftPending") : t("upToDate")}
                </Badge>
              </div>

              <CardDescription className="text-sm">
                {publication
                  ? hasChanges
                    ? t("changesPending", { count: publication.changeCount })
                    : t("publishedAt", { date: formattedDate ?? "" })
                  : t("unavailableDescription")}
              </CardDescription>
            </div>
          </CardHeader>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={!publication}
              onClick={() => {
                setError(null)
                setPanel("history")
              }}
            >
              <History aria-hidden="true" className="size-4" />

              {t("history")}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={!hasChanges}
              onClick={() => setPanel("changes")}
            >
              {t("reviewChanges", { count: publication?.changeCount ?? 0 })}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={disabled || !hasChanges}
              onClick={() => setConfirmation({ kind: "discard" })}
            >
              <RotateCcw aria-hidden="true" className="size-4" />

              {t("discard")}
            </Button>

            <Button
              type="button"
              disabled={disabled || !hasChanges}
              onClick={() => setConfirmation({ kind: "publish" })}
            >
              {working ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin motion-reduce:animate-none"
                />
              ) : (
                <Upload aria-hidden="true" className="size-4" />
              )}

              {working ? t("working") : t("publish")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" role="alert" className="mt-3">
          <AlertDescription>{t(`errors.${error}`)}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert role="status" className="mt-3">
          <AlertDescription>{t(success)}</AlertDescription>
        </Alert>
      )}

      <CatalogChangesDialog
        open={panel === "changes"}
        onOpenChange={(open) => {
          if (!open) setPanel(null)
        }}
        changes={publication?.changes ?? []}
      />

      <CatalogHistoryDialog
        open={panel === "history"}
        userId={userId}
        tenantId={tenantId}
        locale={locale}
        currentVersion={publication?.publishedVersion ?? 0}
        disabled={disabled}
        onOpenChange={(open) => {
          if (!open) setPanel(null)
        }}
        onRestore={(version) => setConfirmation({ kind: "restore", version })}
      />

      <CatalogPublicationConfirmation
        action={confirmation}
        changeCount={publication?.changeCount ?? 0}
        pending={pending}
        working={working}
        onOpenChange={(open) => {
          if (!open && !working) setConfirmation(null)
        }}
        onConfirm={() => void confirmAction()}
      />
    </>
  )
}

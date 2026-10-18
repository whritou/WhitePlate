"use client"

import { useState } from "react"
import { LoaderCircle, RotateCcw, Upload } from "lucide-react"
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
  CatalogHistoryList,
} from "./catalog-publication-dialogs"
import { CatalogPublicationConfirmation } from "./catalog-publication-confirmation"
import type {
  CatalogPublicationSummary,
  PublicationConfirmAction,
  CatalogResult,
} from "@/types/catalog-management"

export function CatalogPublicationPanel({
  mode,
  tenantId,
  userId,
  publication,
  pending,
}: {
  mode: "actions" | "manager"
  tenantId: string
  userId?: string
  publication: CatalogPublicationSummary | null
  pending: boolean
}) {
  const t = useTranslations("CatalogPublication")
  const locale = useLocale()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [panel, setPanel] = useState<"changes" | null>(null)
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
      {mode === "actions" ? (
        <div
          className="flex flex-wrap items-center gap-2"
          aria-busy={working || pending}
        >
          {error && (
            <Alert variant="destructive" role="alert" className="basis-full">
              <AlertDescription>{t(`errors.${error}`)}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert role="status" className="basis-full">
              <AlertDescription>{t(success)}</AlertDescription>
            </Alert>
          )}

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

          {hasChanges && (
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={() => setConfirmation({ kind: "discard" })}
            >
              <RotateCcw aria-hidden="true" className="size-4" />

              {t("discard")}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 p-4 sm:p-6">
          <section
            aria-labelledby="catalog-publication-review-title"
            className="grid gap-4"
          >
            <div className="grid gap-1">
              <h2
                id="catalog-publication-review-title"
                className="font-heading text-xl font-semibold"
              >
                {t("reviewSectionTitle")}
              </h2>

              <p className="text-sm text-muted-foreground">
                {t("reviewSectionDescription")}
              </p>
            </div>

            <Card aria-busy={working || pending}>
              <CardContent className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <CardHeader className="flex min-w-0 flex-row items-start gap-3 p-0">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <Upload aria-hidden="true" className="size-5" />
                  </span>

                  <div className="grid min-w-0 gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base">
                        <h3>
                          {publication
                            ? t("publishedVersion", {
                                version: publication.publishedVersion,
                              })
                            : t("unavailableTitle")}
                        </h3>
                      </CardTitle>

                      <Badge variant={hasChanges ? "warning" : "success"}>
                        {hasChanges ? t("draftPending") : t("upToDate")}
                      </Badge>
                    </div>

                    <CardDescription className="text-sm">
                      {publication
                        ? hasChanges
                          ? t("changesPending", {
                              count: publication.changeCount,
                            })
                          : t("publishedAt", { date: formattedDate ?? "" })
                        : t("unavailableDescription")}
                    </CardDescription>
                  </div>
                </CardHeader>

                <Button
                  type="button"
                  variant="outline"
                  disabled={!hasChanges}
                  onClick={() => setPanel("changes")}
                >
                  {t("reviewChanges", {
                    count: publication?.changeCount ?? 0,
                  })}
                </Button>
              </CardContent>
            </Card>
          </section>

          {publication ? (
            <CatalogHistoryList
              tenantId={tenantId}
              userId={userId}
              currentVersion={publication.publishedVersion}
              disabled={disabled}
              onRestore={(version) =>
                setConfirmation({ kind: "restore", version })
              }
            />
          ) : (
            <section
              aria-labelledby="catalog-history-title"
              className="grid gap-4"
            >
              <h2
                id="catalog-history-title"
                className="font-heading text-xl font-semibold"
              >
                {t("historyTitle")}
              </h2>

              <Alert variant="destructive" role="alert">
                <AlertDescription>
                  {t("unavailableDescription")}
                </AlertDescription>
              </Alert>
            </section>
          )}
        </div>
      )}

      {mode === "manager" && error && (
        <Alert variant="destructive" role="alert" className="mt-3">
          <AlertDescription>{t(`errors.${error}`)}</AlertDescription>
        </Alert>
      )}

      {mode === "manager" && success && (
        <Alert role="status" className="mt-3">
          <AlertDescription>{t(success)}</AlertDescription>
        </Alert>
      )}

      <CatalogChangesDialog
        open={mode === "manager" && panel === "changes"}
        onOpenChange={(open) => {
          if (!open) setPanel(null)
        }}
        changes={publication?.changes ?? []}
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

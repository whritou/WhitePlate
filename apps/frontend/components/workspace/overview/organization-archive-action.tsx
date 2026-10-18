"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { setOrganizationActiveAction } from "@/actions/organization"
import { Button } from "@/components/ui/button"
import { useRouter } from "@/i18n/navigation"
import { useWorkspaceToast } from "@/components/ui/toast"
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogPopup,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function OrganizationArchiveAction({
  organizationId,
  active,
  compact = false,
}: {
  organizationId: string
  active: boolean
  compact?: boolean
}) {
  const t = useTranslations("OrganizationSettings")
  const router = useRouter()
  const toast = useWorkspaceToast()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState(false)
  const [confirming, setConfirming] = useState(false)

  function submit() {
    if (pending) return
    setError(false)
    startTransition(async () => {
      try {
        const result = await setOrganizationActiveAction({
          organizationId,
          active: !active,
        })

        if (!result.ok) {
          setError(true)

          return
        }

        toast.success(t(active ? "archived" : "restored"))

        router.refresh()
      } catch {
        setError(true)
      }
    })
  }

  if (compact)
    return (
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={submit}
      >
        {pending ? t("restoring") : t("restoreOrganization")}
      </Button>
    )

  if (active)
    return (
      <section
        aria-labelledby="organization-danger-zone"
        className="mt-8 grid gap-3 rounded-lg border border-destructive/40 p-4 sm:p-6"
      >
        <div className="grid gap-1">
          <h2
            id="organization-danger-zone"
            className="text-base font-semibold text-destructive"
          >
            {t("dangerZone")}
          </h2>

          <p className="text-sm leading-6 text-muted-foreground">
            {t("archiveDescription")}
          </p>
        </div>

        <AlertDialog open={confirming} onOpenChange={setConfirming}>
          <AlertDialogTrigger
            disabled={pending}
            render={<Button type="button" variant="destructive" />}
          >
            {t("archiveOrganization")}
          </AlertDialogTrigger>

          <AlertDialogPortal>
            <AlertDialogBackdrop />

            <AlertDialogPopup>
              <div className="grid gap-1">
                <AlertDialogTitle>{t("archiveDialogTitle")}</AlertDialogTitle>

                <AlertDialogDescription>
                  {t("archiveDialogDescription")}
                </AlertDialogDescription>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <AlertDialogClose
                  disabled={pending}
                  render={<Button type="button" variant="outline" />}
                >
                  {t("cancel")}
                </AlertDialogClose>

                <Button
                  type="button"
                  variant="destructive"
                  disabled={pending}
                  onClick={() => {
                    setConfirming(false)
                    submit()
                  }}
                >
                  {pending ? t("archiving") : t("confirmArchive")}
                </Button>
              </div>
            </AlertDialogPopup>
          </AlertDialogPortal>
        </AlertDialog>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {t("errors.unavailable")}
          </p>
        )}
      </section>
    )

  return (
    <section
      aria-labelledby="organization-danger-zone"
      className="mt-8 grid gap-3 rounded-lg border border-destructive/40 p-4 sm:p-6"
    >
      <div className="grid gap-1">
        <h2
          id="organization-danger-zone"
          className="text-base font-semibold text-destructive"
        >
          {t("dangerZone")}
        </h2>

        <p className="text-sm leading-6 text-muted-foreground">
          {t(active ? "archiveDescription" : "restoreDescription")}
        </p>
      </div>

      <div>
        <Button
          type="button"
          variant={active ? "destructive" : "outline"}
          disabled={pending}
          onClick={submit}
        >
          {pending
            ? t(active ? "archiving" : "restoring")
            : t(active ? "archiveOrganization" : "restoreOrganization")}
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {t("errors.unavailable")}
        </p>
      )}
    </section>
  )
}

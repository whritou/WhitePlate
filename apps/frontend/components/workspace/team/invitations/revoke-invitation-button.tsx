"use client"

import { revokeStaffInvitationAction } from "@/actions/organization"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { Button } from "@/components/ui/button"
import { useWorkspaceToast } from "@/components/ui/toast"
import { useRouter } from "@/i18n/navigation"
import type { ActionErrorMessage } from "@/types/organization"
import { useTranslations } from "next-intl"
import { useRef, useState, useTransition } from "react"

export function RevokeInvitationButton({
  organizationId,
  invitationId,
  email,
}: {
  organizationId: string
  invitationId: string
  email: string
}) {
  const t = useTranslations("Auth")
  const toast = useWorkspaceToast()
  const router = useRouter()
  const submitting = useRef(false)
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<ActionErrorMessage | null>(null)

  function revoke() {
    if (submitting.current) return

    submitting.current = true
    setError(null)
    startTransition(async () => {
      try {
        const result = await revokeStaffInvitationAction({
          organizationId,
          invitationId,
        })

        if (!result.ok) {
          setError(result.message)

          return
        }

        setConfirming(false)
        toast.success(t("invitationRevoked"))
        router.refresh()
      } catch {
        setError("unavailable")
      } finally {
        submitting.current = false
      }
    })
  }

  return (
    <AlertDialog
      open={confirming}
      onOpenChange={(open) => {
        if (!open && pending) return

        setConfirming(open)
        setError(null)
      }}
    >
      <AlertDialogTrigger
        disabled={pending}
        render={<Button type="button" variant="outline" size="sm" />}
        aria-label={t("revokeInvitationFor", { email })}
      >
        {t("revokeInvitationAction")}
      </AlertDialogTrigger>

      <AlertDialogPortal>
        <AlertDialogBackdrop />

        <AlertDialogPopup>
          <div className="grid gap-1">
            <AlertDialogTitle>{t("revokeInvitationTitle")}</AlertDialogTitle>

            <AlertDialogDescription>
              {t("revokeInvitationDescription", { email })}
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
              onClick={revoke}
            >
              {pending ? t("revokingInvitation") : t("confirmRevokeInvitation")}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{t(`teamErrors.${error}`)}</AlertDescription>
            </Alert>
          )}
        </AlertDialogPopup>
      </AlertDialogPortal>
    </AlertDialog>
  )
}

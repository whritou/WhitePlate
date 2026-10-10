"use client"
import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"
import { EditorDialog } from "@/components/ui/editor-dialog"
import { StaffInvitationForm } from "@/components/auth/staff-invitation-form"
import { Alert, AlertDescription } from "@/components/ui/alert"
export function StaffInviteDialog({
  organizationId,
  restaurants,
}: {
  organizationId: string
  restaurants: { id: string; name: string }[] | null
}) {
  const t = useTranslations("Auth")
  const v = useTranslations("LiveParity")

  return (
    <EditorDialog
      sourcePrimary
      icon={Plus}
      title={t("teamInviteTitle")}
      label={v("inviteMember")}
      description={t("teamInviteDescription")}
    >
      {(callbacks) =>
        restaurants === null ? (
          <Alert variant="destructive">
            <AlertDescription>{t("serviceError")}</AlertDescription>
          </Alert>
        ) : (
          <StaffInvitationForm
            organizationId={organizationId}
            restaurants={restaurants}
            {...callbacks}
          />
        )
      }
    </EditorDialog>
  )
}

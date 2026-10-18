"use client"
import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"
import { EditorDialog } from "@/components/ui/editor-dialog"
import { StaffInvitationForm } from "@/components/auth/staff-invitation-form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { OrganizationRoleAssignmentOption } from "@/types/organization"
export function StaffInviteDialog({
  organizationId,
  restaurants,
  roleOptions,
  allowOwnerInvitation = true,
}: {
  organizationId: string
  restaurants: { id: string; name: string }[] | null
  roleOptions: OrganizationRoleAssignmentOption[] | null
  allowOwnerInvitation?: boolean
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
        restaurants === null || roleOptions === null ? (
          <Alert variant="destructive">
            <AlertDescription>{t("serviceError")}</AlertDescription>
          </Alert>
        ) : (
          <StaffInvitationForm
            organizationId={organizationId}
            restaurants={restaurants}
            roleOptions={roleOptions}
            allowOwnerInvitation={allowOwnerInvitation}
            {...callbacks}
          />
        )
      }
    </EditorDialog>
  )
}

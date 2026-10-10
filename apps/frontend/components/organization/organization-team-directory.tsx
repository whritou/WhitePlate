import { TeamMembersTable } from "./team-members-table"
import { TeamDirectoryTabs } from "./team-directory-tabs"
import type { ReactNode } from "react"
import { LovableRolePreview } from "./lovable-role-preview"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import type {
  OrganizationInvitationStatus,
  OrganizationTeamDirectoryProps,
} from "@/types/organization"
import { getLocale, getTranslations } from "next-intl/server"
import { RevokeInvitationButton } from "./revoke-invitation-button"

function statusVariant(status: OrganizationInvitationStatus) {
  return status === "Pending"
    ? "warning"
    : status === "Accepted"
      ? "success"
      : "destructive"
}

export async function OrganizationTeamDirectory({
  organizationId,
  members,
  invitations,
  heading,
  action,
}: OrganizationTeamDirectoryProps & {
  heading?: ReactNode
  action?: ReactNode
}) {
  const [locale, t, v] = await Promise.all([
    getLocale(),
    getTranslations("Auth"),
    getTranslations("LovableLive"),
  ])

  return (
    <TeamDirectoryTabs heading={heading} action={action}>
      <div className="grid max-w-full grid-cols-3 border">
        {[
          [v("members"), members?.length ?? "—"],
          [
            v("pending"),
            invitations?.filter((item) => item.status === "Pending").length ??
              "—",
          ],
          [v("roles"), 3],
        ].map(([label, value], index) => (
          <div key={label} className={`px-5 py-3 ${index ? "border-l" : ""}`}>
            <p className="label-mono text-muted-foreground">{label}</p>

            <p className="font-display text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <TeamMembersTable members={members} />

      <section className="min-w-0">
        <header className="sr-only">
          <h2 className="font-display text-xl font-bold">
            {t("teamInvitationsTitle")}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {t("teamInvitationsDescription")}
          </p>
        </header>

        {invitations === null ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{t("serviceError")}</AlertDescription>
          </Alert>
        ) : invitations.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            {t("teamInvitationsEmpty")}
          </p>
        ) : (
          <ul className="grid gap-3">
            {invitations.map((invitation) => (
              <li
                key={invitation.id}
                className="flex flex-wrap items-center justify-between gap-4 border p-4"
              >
                <div className="min-w-0">
                  <p className="font-bold">{invitation.email}</p>

                  <p className="label-mono text-muted-foreground">
                    {t(`teamRoles.${invitation.role}`)} ·{" "}
                    {invitation.tenantName ?? t("organizationScope")}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("invitationExpiresOn", {
                      date: new Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                      }).format(new Date(invitation.expiresAt)),
                    })}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={statusVariant(invitation.status)}>
                    {t(`invitationStatus.${invitation.status}`)}
                  </Badge>

                  {invitation.status === "Pending" && (
                    <RevokeInvitationButton
                      organizationId={organizationId}
                      invitationId={invitation.id}
                      email={invitation.email}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <LovableRolePreview />
    </TeamDirectoryTabs>
  )
}

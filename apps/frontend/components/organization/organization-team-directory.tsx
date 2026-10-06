import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type {
  OrganizationInvitationStatus,
  OrganizationTeamDirectoryProps,
  OrganizationTeamRole,
} from "@/types/organization"
import { getLocale, getTranslations } from "next-intl/server"
import { RevokeInvitationButton } from "./revoke-invitation-button"

function roleLabel(role: OrganizationTeamRole, t: (key: string) => string) {
  return t(`teamRoles.${role}`)
}

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
}: OrganizationTeamDirectoryProps) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("Auth")])

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="rounded-lg border border-border bg-card">
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg font-semibold">{t("teamRosterTitle")}</h2>
          </CardTitle>

          <CardDescription>{t("teamRosterDescription")}</CardDescription>
        </CardHeader>

        <CardContent>
          {members === null ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{t("serviceError")}</AlertDescription>
            </Alert>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("teamRosterEmpty")}
            </p>
          ) : (
            <ul className="grid gap-3">
              {members.map((member, index) => (
                <li
                  key={`${member.role}:${member.tenantId ?? "organization"}:${member.email ?? "unknown"}:${index}`}
                  className="flex min-w-0 flex-wrap items-start justify-between gap-3 rounded-lg border border-border px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {member.email ?? t("teamMemberEmailUnavailable")}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {member.tenantName ?? t("organizationScope")}
                    </p>
                  </div>

                  <Badge variant="secondary">{roleLabel(member.role, t)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-lg border border-border bg-card">
        <CardHeader>
          <CardTitle>
            <h2 className="text-lg font-semibold">
              {t("teamInvitationsTitle")}
            </h2>
          </CardTitle>

          <CardDescription>{t("teamInvitationsDescription")}</CardDescription>
        </CardHeader>

        <CardContent>
          {invitations === null ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{t("serviceError")}</AlertDescription>
            </Alert>
          ) : invitations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("teamInvitationsEmpty")}
            </p>
          ) : (
            <ul className="grid gap-3">
              {invitations.map((invitation) => (
                <li
                  key={invitation.id}
                  className="grid gap-3 rounded-lg border border-border px-4 py-3"
                >
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {invitation.email}
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {roleLabel(invitation.role, t)} ·{" "}
                        {invitation.tenantName ?? t("organizationScope")}
                      </p>
                    </div>

                    <Badge variant={statusVariant(invitation.status)}>
                      {t(`invitationStatus.${invitation.status}`)}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                      {t("invitationExpiresOn", {
                        date: new Intl.DateTimeFormat(locale, {
                          dateStyle: "medium",
                        }).format(new Date(invitation.expiresAt)),
                      })}
                    </p>

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
        </CardContent>
      </Card>
    </div>
  )
}

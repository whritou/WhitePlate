import { LovableRolePreview } from "./lovable-role-preview"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
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
}: OrganizationTeamDirectoryProps) {
  const [locale, t, v] = await Promise.all([
    getLocale(),
    getTranslations("Auth"),
    getTranslations("LovableLive"),
  ])

  return (
    <div className="live-team-directory grid min-w-0 gap-6">
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

      <section className="min-w-0 border">
        <header className="border-b px-5 py-4">
          <h2 className="font-display text-xl font-bold">
            {t("teamRosterTitle")}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {t("teamRosterDescription")}
          </p>
        </header>

        {members === null ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{t("serviceError")}</AlertDescription>
          </Alert>
        ) : members.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            {t("teamRosterEmpty")}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary">
                <TableHead>{t("email")}</TableHead>

                <TableHead>{v("role")}</TableHead>

                <TableHead>{v("scope")}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {members.map((member, index) => (
                <TableRow
                  key={`${member.role}:${member.tenantId}:${member.email}:${index}`}
                >
                  <TableCell className="font-semibold">
                    {member.email ?? t("teamMemberEmailUnavailable")}
                  </TableCell>

                  <TableCell>
                    <Badge variant="secondary">
                      {t(`teamRoles.${member.role}`)}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {member.tenantName ?? t("organizationScope")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="min-w-0 border">
        <header className="border-b px-5 py-4">
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
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary">
                <TableHead>{t("email")}</TableHead>

                <TableHead>{v("role")}</TableHead>

                <TableHead>{v("scope")}</TableHead>

                <TableHead>{v("status")}</TableHead>

                <TableHead>{v("expires")}</TableHead>

                <TableHead>{v("actions")}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell className="font-semibold">
                    {invitation.email}
                  </TableCell>

                  <TableCell>{t(`teamRoles.${invitation.role}`)}</TableCell>

                  <TableCell>
                    {invitation.tenantName ?? t("organizationScope")}
                  </TableCell>

                  <TableCell>
                    <Badge variant={statusVariant(invitation.status)}>
                      {t(`invitationStatus.${invitation.status}`)}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {t("invitationExpiresOn", {
                      date: new Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                      }).format(new Date(invitation.expiresAt)),
                    })}
                  </TableCell>

                  <TableCell>
                    {invitation.status === "Pending" && (
                      <RevokeInvitationButton
                        organizationId={organizationId}
                        invitationId={invitation.id}
                        email={invitation.email}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <LovableRolePreview />
    </div>
  )
}

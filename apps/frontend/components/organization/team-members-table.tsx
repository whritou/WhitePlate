"use client"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { changeRestaurantMemberRoleAction } from "@/actions/organization"
import type {
  OrganizationRoleAssignmentOption,
  OrganizationTeamMember,
  OrganizationTeamRole,
} from "@/types/organization"
import { useRouter } from "@/i18n/navigation"

export function TeamMembersTable({
  organizationId,
  members,
  roleOptions,
  allowRoleChanges,
}: {
  organizationId: string
  members: OrganizationTeamMember[] | null
  roleOptions: OrganizationRoleAssignmentOption[] | null
  allowRoleChanges: boolean
}) {
  const t = useTranslations("Auth"),
    v = useTranslations("LovableLive")
  const router = useRouter()
  const [search, setSearch] = useState(""),
    [role, setRole] = useState("all")
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null)
  const [roleFeedback, setRoleFeedback] = useState<{
    memberId: string
    ok: boolean
  } | null>(null)
  const roles = Array.from(
    new Map(
      (members ?? []).map((member) => [
        member.roleId ?? member.role,
        { id: member.roleId ?? member.role, member },
      ])
    ).values()
  )
  const filtered = (members ?? []).filter(
    (member) =>
      (role === "all" || (member.roleId ?? member.role) === role) &&
      (member.email ?? "")
        .toLocaleLowerCase()
        .includes(search.trim().toLocaleLowerCase())
  )

  function roleLabel(member: OrganizationTeamMember) {
    return member.builtInKey
      ? t(`teamRoles.${teamRoleKey(member.builtInKey, member.role)}`)
      : (member.roleName ?? t(`teamRoles.${member.role}`))
  }

  function optionLabel(option: OrganizationRoleAssignmentOption) {
    return option.builtInKey
      ? t(`teamRoles.${teamRoleKey(option.builtInKey, "RestaurantStaff")}`)
      : option.name
  }

  async function changeRole(member: OrganizationTeamMember, roleId: string) {
    if (!member.memberId || !roleId || updatingMemberId) return

    setUpdatingMemberId(member.memberId)
    setRoleFeedback(null)

    const result = await changeRestaurantMemberRoleAction({
      organizationId,
      memberId: member.memberId,
      roleId,
    }).catch(() => ({ ok: false as const, message: "unavailable" as const }))

    setUpdatingMemberId(null)
    setRoleFeedback({ memberId: member.memberId, ok: result.ok })

    if (result.ok) router.refresh()
  }

  return (
    <section className="min-w-0">
      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          className="w-72 max-w-full"
          aria-label={v("searchMembers")}
          placeholder={v("searchMembers")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <NativeSelect
          aria-label={v("filterRole")}
          value={role}
          onChange={(event) => setRole(event.target.value)}
        >
          <NativeSelectOption value="all">{v("allRoles")}</NativeSelectOption>

          {roles.map((value) => (
            <NativeSelectOption key={value.id} value={value.id}>
              {roleLabel(value.member)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      <header className="sr-only">
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
      ) : filtered.length === 0 ? (
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

              {allowRoleChanges && <TableHead>{v("changeRole")}</TableHead>}
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.map((member, index) => (
              <TableRow
                key={
                  member.memberId ??
                  `${member.role}:${member.tenantId}:${member.email}:${index}`
                }
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="grid size-9 shrink-0 place-items-center bg-primary text-sm font-bold text-primary-foreground"
                    >
                      {member.email?.slice(0, 2).toUpperCase() ?? "—"}
                    </span>

                    <span className="font-semibold">
                      {member.email ?? t("teamMemberEmailUnavailable")}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge variant="secondary">{roleLabel(member)}</Badge>
                </TableCell>

                <TableCell>
                  {member.tenantName ?? t("organizationScope")}
                </TableCell>

                {allowRoleChanges && (
                  <TableCell>
                    {member.memberId &&
                    member.role !== "OrganizationOwner" &&
                    roleOptions ? (
                      <div className="grid gap-1">
                        <NativeSelect
                          aria-label={v("changeMemberRole", {
                            member:
                              member.email ?? t("teamMemberEmailUnavailable"),
                          })}
                          value={member.roleId ?? ""}
                          disabled={updatingMemberId !== null}
                          onChange={(event) =>
                            void changeRole(member, event.target.value)
                          }
                          className="min-w-40"
                        >
                          {roleOptions.map((option) => (
                            <NativeSelectOption
                              key={option.role}
                              value={option.role}
                            >
                              {optionLabel(option)}
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>

                        {roleFeedback?.memberId === member.memberId && (
                          <span
                            role={roleFeedback.ok ? "status" : "alert"}
                            className="text-xs"
                          >
                            {t(
                              roleFeedback.ok
                                ? "memberRoleUpdated"
                                : "memberRoleUpdateError"
                            )}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  )
}

function teamRoleKey(
  builtInKey: string,
  fallback: OrganizationTeamRole
): OrganizationTeamRole {
  const roles: Record<string, OrganizationTeamRole> = {
    Manager: "RestaurantManager",
    Kitchen: "KitchenStaff",
    Staff: "RestaurantStaff",
    Accountant: "Accountant",
    OrganizationOwner: "OrganizationOwner",
  }

  return roles[builtInKey] ?? fallback
}

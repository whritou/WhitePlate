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
import type { OrganizationTeamMember } from "@/types/organization"

export function TeamMembersTable({
  members,
}: {
  members: OrganizationTeamMember[] | null
}) {
  const t = useTranslations("Auth"),
    v = useTranslations("LovableLive")
  const [search, setSearch] = useState(""),
    [role, setRole] = useState("all")
  const roles = [...new Set((members ?? []).map((member) => member.role))]
  const filtered = (members ?? []).filter(
    (member) =>
      (role === "all" || member.role === role) &&
      (member.email ?? "")
        .toLocaleLowerCase()
        .includes(search.trim().toLocaleLowerCase())
  )

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
            <NativeSelectOption key={value} value={value}>
              {t(`teamRoles.${value}`)}
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
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.map((member, index) => (
              <TableRow
                key={`${member.role}:${member.tenantId}:${member.email}:${index}`}
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
  )
}

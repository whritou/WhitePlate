"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import {
  archiveOrganizationRoleAction,
  createOrganizationRoleAction,
  saveOrganizationRoleGrantAction,
} from "@/actions/organization"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RoleNameInput } from "./role-name-input"
import { RoleArchiveDialog } from "./role-archive-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type {
  OrganizationRoleGrant,
  RestaurantPermissionKey,
} from "@/types/organization"

const permissions: RestaurantPermissionKey[] = [
  "orders.manage",
  "kitchen.display",
  "catalog.manage",
  "discounts.manage",
  "analytics.view",
  "storefront.manage",
  "staff.manage",
  "billing.manage",
]

export function RolePermissionsEditor({
  organizationId,
  initialGrants,
}: {
  organizationId: string
  initialGrants: OrganizationRoleGrant[]
}) {
  const t = useTranslations("RolePermissions")
  const router = useRouter()
  const [grants, setGrants] = useState(initialGrants)
  const [savingRole, setSavingRole] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{
    role: string
    ok: boolean
  } | null>(null)
  const [customRoleName, setCustomRoleName] = useState("")
  const [creatingRole, setCreatingRole] = useState(false)
  const [createFeedback, setCreateFeedback] = useState<boolean | null>(null)
  const [archiveTarget, setArchiveTarget] =
    useState<OrganizationRoleGrant | null>(null)
  const [archivingRole, setArchivingRole] = useState<string | null>(null)
  const [archiveError, setArchiveError] = useState(false)

  function toggle(
    role: OrganizationRoleGrant["role"],
    permission: RestaurantPermissionKey
  ) {
    setGrants((current) =>
      current.map((grant) => {
        if (grant.role !== role || grant.isProtected) return grant

        const enabled = grant.permissions.includes(permission)

        return {
          ...grant,
          permissions: enabled
            ? grant.permissions.filter((key) => key !== permission)
            : [...grant.permissions, permission],
        }
      })
    )
    setFeedback(null)
  }

  async function save(grant: OrganizationRoleGrant) {
    if (grant.isProtected || savingRole) return
    setSavingRole(grant.role)
    setFeedback(null)

    const result = await saveOrganizationRoleGrantAction({
      organizationId,
      role: grant.role,
      ...(!grant.isBuiltIn ? { name: grant.name } : {}),
      permissions: grant.permissions,
      version: grant.version,
    }).catch(() => ({ ok: false as const, message: "unavailable" as const }))

    setSavingRole(null)
    if (result.ok) {
      setGrants((current) =>
        current.map((item) =>
          item.role === result.grant.role ? result.grant : item
        )
      )
      setFeedback({ role: grant.role, ok: true })
      router.refresh()
    } else {
      setFeedback({ role: grant.role, ok: false })
      if (result.message === "unavailable") router.refresh()
    }
  }

  async function createRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (creatingRole) return

    setCreatingRole(true)
    setCreateFeedback(null)

    const result = await createOrganizationRoleAction({
      organizationId,
      name: customRoleName,
      permissions: [],
    }).catch(() => ({ ok: false as const, message: "unavailable" as const }))

    setCreatingRole(false)

    if (result.ok) {
      setGrants((current) => [...current, result.grant])
      setCustomRoleName("")
      setCreateFeedback(true)
      router.refresh()
    } else setCreateFeedback(false)
  }

  async function archiveRole(grant: OrganizationRoleGrant) {
    if (grant.isBuiltIn || archivingRole) return

    setArchivingRole(grant.role)
    setArchiveError(false)

    const result = await archiveOrganizationRoleAction({
      organizationId,
      roleId: grant.role,
      version: grant.version,
    }).catch(() => ({ ok: false as const, message: "unavailable" as const }))

    setArchivingRole(null)

    if (result.ok) {
      setGrants((current) =>
        current.map((item) =>
          item.role === grant.role ? { ...item, isArchived: true } : item
        )
      )
      setArchiveTarget(null)
      router.refresh()
    } else setArchiveError(true)
  }

  function roleName(grant: OrganizationRoleGrant) {
    return grant.isBuiltIn && grant.builtInKey
      ? t(`roles.${grant.builtInKey}`)
      : grant.name
  }

  return (
    <section className="min-w-0 border">
      <header className="border-b p-5">
        <h2 className="font-display text-xl font-bold">{t("title")}</h2>

        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
      </header>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary">
              <TableHead className="min-w-44">{t("role")}</TableHead>

              {permissions.map((permission) => (
                <TableHead key={permission} className="min-w-32">
                  {t(`permissions.${permission}`)}
                </TableHead>
              ))}

              <TableHead className="min-w-32 text-right">
                {t("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {grants.map((grant) => (
              <TableRow key={grant.role}>
                <TableCell className="font-semibold">
                  {grant.isBuiltIn || grant.isArchived ? (
                    roleName(grant)
                  ) : (
                    <RoleNameInput
                      role={grant.role}
                      name={grant.name}
                      ariaLabel={t("renameRole", { role: roleName(grant) })}
                      disabled={savingRole !== null || archivingRole !== null}
                      setGrants={setGrants}
                      onEdit={() => setFeedback(null)}
                    />
                  )}

                  {grant.isProtected && (
                    <span className="mt-1 block text-xs font-normal text-muted-foreground">
                      {t("ownerProtected")}
                    </span>
                  )}
                </TableCell>

                {permissions.map((permission) => (
                  <TableCell key={permission}>
                    <Checkbox
                      aria-label={t("togglePermission", {
                        permission: t(`permissions.${permission}`),
                        role: roleName(grant),
                      })}
                      checked={grant.permissions.includes(permission)}
                      disabled={
                        grant.isProtected ||
                        grant.isArchived ||
                        savingRole !== null ||
                        archivingRole !== null
                      }
                      onCheckedChange={() => toggle(grant.role, permission)}
                    />
                  </TableCell>
                ))}

                <TableCell className="text-right">
                  {grant.isProtected ? (
                    <span className="text-sm text-muted-foreground">
                      {t("fixed")}
                    </span>
                  ) : grant.isArchived ? (
                    <span className="text-sm text-muted-foreground">
                      {t("archived")}
                    </span>
                  ) : (
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={savingRole !== null || archivingRole !== null}
                        onClick={() => void save(grant)}
                      >
                        {savingRole === grant.role ? t("saving") : t("save")}
                      </Button>

                      {!grant.isBuiltIn && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          aria-label={t("archiveRole", {
                            role: roleName(grant),
                          })}
                          disabled={
                            savingRole !== null || archivingRole !== null
                          }
                          onClick={() => {
                            setArchiveError(false)
                            setArchiveTarget(grant)
                          }}
                        >
                          {t("archive")}
                        </Button>
                      )}
                    </div>
                  )}

                  {feedback?.role === grant.role && (
                    <span
                      className="sr-only"
                      role={feedback.ok ? "status" : "alert"}
                    >
                      {t(feedback.ok ? "saved" : "saveError")}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <form className="grid gap-4 border-t p-5" onSubmit={createRole}>
        <div>
          <h3 className="font-display text-lg font-bold">{t("createRole")}</h3>

          <p className="mt-1 text-sm text-muted-foreground">
            {t("createRoleDescription")}
          </p>
        </div>

        <Label
          className="grid max-w-md gap-2 font-medium"
          htmlFor="custom-role-name"
        >
          {t("customRoleName")}

          <Input
            id="custom-role-name"
            name="customRoleName"
            value={customRoleName}
            maxLength={60}
            required
            disabled={creatingRole}
            onChange={(event) => setCustomRoleName(event.target.value)}
            className="px-3"
          />
        </Label>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            disabled={creatingRole || !customRoleName.trim()}
          >
            {creatingRole ? t("creatingRole") : t("createRoleAction")}
          </Button>

          {createFeedback !== null && (
            <span
              role={createFeedback ? "status" : "alert"}
              className="text-sm"
            >
              {t(createFeedback ? "roleCreated" : "createRoleError")}
            </span>
          )}
        </div>
      </form>

      <RoleArchiveDialog
        open={archiveTarget !== null}
        archiving={archivingRole !== null}
        error={archiveError}
        roleName={archiveTarget ? roleName(archiveTarget) : ""}
        onOpenChange={(open) => {
          if (!open && archivingRole === null) setArchiveTarget(null)
        }}
        onConfirm={() => {
          if (archiveTarget) void archiveRole(archiveTarget)
        }}
      />

      {feedback && !feedback.ok && (
        <Alert variant="destructive" role="alert" className="m-5">
          <AlertDescription>{t("saveError")}</AlertDescription>
        </Alert>
      )}
    </section>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { saveOrganizationRoleGrantAction } from "@/actions/organization"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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

  return (
    <section className="min-w-0 border">
      <header className="border-b p-5">
        <h2 className="font-display text-xl font-bold">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("description")}
        </p>
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
                  {t(`roles.${grant.role}`)}
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
                        role: t(`roles.${grant.role}`),
                      })}
                      checked={grant.permissions.includes(permission)}
                      disabled={grant.isProtected || savingRole !== null}
                      onCheckedChange={() => toggle(grant.role, permission)}
                    />
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  {grant.isProtected ? (
                    <span className="text-sm text-muted-foreground">
                      {t("fixed")}
                    </span>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      disabled={savingRole !== null}
                      onClick={() => void save(grant)}
                    >
                      {savingRole === grant.role ? t("saving") : t("save")}
                    </Button>
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

      {feedback && !feedback.ok && (
        <Alert variant="destructive" role="alert" className="m-5">
          <AlertDescription>{t("saveError")}</AlertDescription>
        </Alert>
      )}
    </section>
  )
}

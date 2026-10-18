"use client"

import { sendStaffInvitationAction } from "@/actions/organization"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { useWorkspaceToast } from "@/components/ui/toast"
import { useRouter } from "@/i18n/navigation"
import type { EditorCallbacks } from "@/types/editor"
import type {
  ActionState,
  OrganizationRoleAssignmentOption,
  OrganizationTeamRole,
} from "@/types/organization"
import { ArrowRight, LoaderCircle } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useState, type FormEvent } from "react"
import { ResultMessage } from "./result-message"

export function StaffInvitationForm({
  organizationId,
  restaurants,
  roleOptions,
  allowOwnerInvitation = true,
  onPendingChange,
  onSuccess,
}: EditorCallbacks & {
  organizationId: string
  restaurants: { id: string; name: string }[]
  roleOptions: OrganizationRoleAssignmentOption[]
  allowOwnerInvitation?: boolean
}) {
  const t = useTranslations("Auth")
  const toast = useWorkspaceToast()
  const router = useRouter()
  const locale = useLocale()
  const [tenantId, setTenantId] = useState(restaurants[0]?.id ?? "")
  const defaultRole =
    roleOptions.find((option) => option.builtInKey === "Kitchen")?.role ??
    roleOptions[0]?.role ??
    ""
  const [role, setRole] = useState(
    restaurants.length ? defaultRole : "OrganizationOwner"
  )
  const [state, setState] = useState<ActionState>({ status: "idle" })

  function roleLabel(option: OrganizationRoleAssignmentOption) {
    if (!option.builtInKey) return option.name

    const roleKeys: Record<string, OrganizationTeamRole> = {
      OrganizationOwner: "OrganizationOwner",
      Manager: "RestaurantManager",
      Kitchen: "KitchenStaff",
      Staff: "RestaurantStaff",
      Accountant: "Accountant",
    }

    const roleKey = roleKeys[option.builtInKey]

    return roleKey ? t(`teamRoles.${roleKey}`) : option.name
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState({ status: "pending" })
    onPendingChange?.(true)

    const result = await sendStaffInvitationAction(
      new FormData(event.currentTarget)
    ).catch(() => ({ ok: false as const, message: "unavailable" as const }))

    onPendingChange?.(false)
    if (result.ok) {
      toast.success(t("invitationSent"))
      router.refresh()
      setState({ status: "idle" })
      onSuccess?.()
    } else setState({ status: "error", error: result.message })
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <input type="hidden" name="organizationId" value={organizationId} />

      <input type="hidden" name="locale" value={locale} />

      <Label className="grid gap-2 font-medium" htmlFor="invite-email">
        {t("email")}

        <Input
          id="invite-email"
          name="email"
          disabled={state.status === "pending"}
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          className="px-3"
        />
      </Label>

      <Label className="grid gap-2 font-medium" htmlFor="invite-role">
        {t("staffRole")}

        <NativeSelect
          id="invite-role"
          name="role"
          disabled={state.status === "pending"}
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="w-full"
          selectClassName="px-3"
        >
          {tenantId ? (
            roleOptions.map((option) => (
              <NativeSelectOption key={option.role} value={option.role}>
                {roleLabel(option)}
              </NativeSelectOption>
            ))
          ) : allowOwnerInvitation ? (
            <NativeSelectOption value="OrganizationOwner">
              {t("organizationOwner")}
            </NativeSelectOption>
          ) : null}
        </NativeSelect>
      </Label>

      {restaurants.length > 0 && (
        <Label
          className="grid gap-2 font-medium"

          htmlFor="invite-restaurant"
        >
          {t("restaurant")}

          <NativeSelect
            id="invite-restaurant"
            name="tenantId"
            disabled={state.status === "pending"}
            value={tenantId}
            onChange={(event) => {
              const nextTenantId = event.target.value

              setTenantId(nextTenantId)
              setRole(
                nextTenantId
                  ? defaultRole
                  : allowOwnerInvitation
                    ? "OrganizationOwner"
                    : defaultRole
              )
            }}
            className="w-full"
            selectClassName="px-3"
          >
            {allowOwnerInvitation && (
              <NativeSelectOption value="">
                {t("organizationScope")}
              </NativeSelectOption>
            )}

            {restaurants.map((restaurant) => (
              <NativeSelectOption key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>

          <span className="text-sm font-normal text-muted-foreground">
            {t("restaurantScopeHint")}
          </span>
        </Label>
      )}

      {tenantId && roleOptions.length === 0 && (
        <p role="alert" className="text-sm text-destructive">
          {t("noAssignableRoles")}
        </p>
      )}

      <ResultMessage
        state={state}
        hideSuccess
        message={
          state.status === "success"
            ? t("invitationSent")
            : state.error === "unauthorized"
              ? t("sessionRequired")
              : state.error === "invalid"
                ? t("invalidInvitation")
                : t("serviceError")
        }
      />

      <Button
        type="submit"
        disabled={
          state.status === "pending" ||
          (tenantId !== "" && roleOptions.length === 0)
        }
      >
        {state.status === "pending" ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <>
            {t("sendInvitationAction")}

            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  )
}

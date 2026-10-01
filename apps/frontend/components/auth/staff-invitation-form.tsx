"use client"

import { sendStaffInvitationAction } from "@/actions/organization"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import type { ActionState } from "@/types/organization"
import { ArrowRight, LoaderCircle } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useState, type FormEvent } from "react"
import { ResultMessage } from "./result-message"

export function StaffInvitationForm({
  organizationId,
  restaurants,
}: {
  organizationId: string
  restaurants: { id: string; name: string }[]
}) {
  const t = useTranslations("Auth")
  const locale = useLocale()
  const [tenantId, setTenantId] = useState(restaurants[0]?.id ?? "")
  const [role, setRole] = useState<
    "OrganizationOwner" | "RestaurantManager" | "KitchenStaff"
  >(restaurants.length ? "KitchenStaff" : "OrganizationOwner")
  const [state, setState] = useState<ActionState>({ status: "idle" })

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState({ status: "pending" })

    const result = await sendStaffInvitationAction(
      new FormData(event.currentTarget)
    ).catch(() => ({ ok: false as const, message: "unavailable" as const }))

    setState(
      result.ok
        ? { status: "success" }
        : { status: "error", error: result.message }
    )
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <input type="hidden" name="organizationId" value={organizationId} />

      <input type="hidden" name="locale" value={locale} />

      <Label className="grid gap-2 text-sm font-medium" htmlFor="invite-email">
        {t("email")}

        <Input
          id="invite-email"
          name="email"
          disabled={state.status === "pending"}
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          className="h-11 rounded-lg border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        />
      </Label>

      <Label className="grid gap-2 text-sm font-medium" htmlFor="invite-role">
        {t("staffRole")}

        <NativeSelect
          id="invite-role"
          name="role"
          disabled={state.status === "pending"}
          value={role}
          onChange={(event) => setRole(event.target.value as typeof role)}
          className="w-full"
          selectClassName="h-11 rounded-lg border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          {tenantId ? (
            <>
              <NativeSelectOption value="KitchenStaff">
                {t("kitchenStaff")}
              </NativeSelectOption>

              <NativeSelectOption value="RestaurantManager">
                {t("restaurantManager")}
              </NativeSelectOption>
            </>
          ) : (
            <NativeSelectOption value="OrganizationOwner">
              {t("organizationOwner")}
            </NativeSelectOption>
          )}
        </NativeSelect>
      </Label>

      {restaurants.length > 0 && (
        <Label
          className="grid gap-2 text-sm font-medium"

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
              setRole(nextTenantId ? "KitchenStaff" : "OrganizationOwner")
            }}
            className="w-full"
            selectClassName="h-11 rounded-lg border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            <NativeSelectOption value="">
              {t("organizationScope")}
            </NativeSelectOption>

            {restaurants.map((restaurant) => (
              <NativeSelectOption key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>

          <span className="text-xs font-normal text-muted-foreground">
            {t("restaurantScopeHint")}
          </span>
        </Label>
      )}

      <ResultMessage
        state={state}
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
        disabled={state.status === "pending"}
        className="h-11 rounded-lg"
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

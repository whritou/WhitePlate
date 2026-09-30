"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "@/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import { ArrowRight, LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { acceptStaffInvitationAction, createOrganizationAction, sendStaffInvitationAction } from "@/lib/organization-actions"

type ActionState = { status: "idle" | "pending" | "success" | "error"; error?: string }

function ResultMessage({ state, message }: { state: ActionState; message: string }) {
  if (state.status === "idle" || state.status === "pending") return null
  return <p role={state.status === "success" ? "status" : "alert"} className={`rounded-lg border px-3 py-2 text-sm ${state.status === "success" ? "border-primary/20 bg-primary/5 text-foreground" : "border-destructive/30 bg-destructive/5 text-destructive"}`}>{message}</p>
}

export function OrganizationForm() {
  const t = useTranslations("Auth")
  const locale = useLocale()
  const router = useRouter()
  const [state, setState] = useState<ActionState>({ status: "idle" })

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState({ status: "pending" })
    const result = await createOrganizationAction(new FormData(event.currentTarget))
    if (result.ok) {
      setState({ status: "success" })
      router.push("/organization")
    } else setState({ status: "error", error: result.message })
  }

  return <form onSubmit={submit} className="grid gap-5">
    <label className="grid gap-2 text-sm font-medium" htmlFor="organization-name">{t("organizationName")}
      <input id="organization-name" name="name" required maxLength={200} className="h-11 rounded-lg border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/30" />
    </label>
    <input type="hidden" name="locale" value={locale} />
    <ResultMessage state={state} message={state.status === "success" ? t("organizationCreated") : state.error === "unauthorized" ? t("sessionRequired") : state.error === "invalid" ? t("invalidOrganization") : t("serviceError")} />
    <Button type="submit" disabled={state.status === "pending"} className="h-11 rounded-lg">{state.status === "pending" ? <LoaderCircle className="size-4 animate-spin" /> : <>{t("createOrganizationAction")}<ArrowRight className="size-4" /></>}</Button>
  </form>
}

export function StaffInvitationForm({
  organizationId, restaurants,
}: { organizationId: string; restaurants: { id: string; name: string }[] }) {
  const t = useTranslations("Auth")
  const locale = useLocale()
  const [tenantId, setTenantId] = useState(restaurants[0]?.id ?? "")
  const [role, setRole] = useState<"OrganizationOwner" | "RestaurantManager" | "KitchenStaff">(
    restaurants.length ? "KitchenStaff" : "OrganizationOwner",
  )
  const [state, setState] = useState<ActionState>({ status: "idle" })

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState({ status: "pending" })
    const result = await sendStaffInvitationAction(new FormData(event.currentTarget))
    setState(result.ok ? { status: "success" } : { status: "error", error: result.message })
  }

  return <form onSubmit={submit} className="grid gap-5">
    <input type="hidden" name="organizationId" value={organizationId} />
    <input type="hidden" name="locale" value={locale} />
    <label className="grid gap-2 text-sm font-medium" htmlFor="invite-email">{t("email")}
      <input id="invite-email" name="email" type="email" required maxLength={254} autoComplete="email" className="h-11 rounded-lg border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/30" />
    </label>
    <label className="grid gap-2 text-sm font-medium" htmlFor="invite-role">{t("staffRole")}
      <select id="invite-role" name="role" value={role} onChange={(event) => setRole(event.target.value as typeof role)} className="h-11 rounded-lg border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/30">
        {tenantId ? <>
          <option value="KitchenStaff">{t("kitchenStaff")}</option>
          <option value="RestaurantManager">{t("restaurantManager")}</option>
        </> : <option value="OrganizationOwner">{t("organizationOwner")}</option>}
      </select>
    </label>
    {restaurants.length > 0 && <label className="grid gap-2 text-sm font-medium" htmlFor="invite-restaurant">{t("restaurant")}
      <select id="invite-restaurant" name="tenantId" value={tenantId} onChange={(event) => {
        const nextTenantId = event.target.value
        setTenantId(nextTenantId)
        setRole(nextTenantId ? "KitchenStaff" : "OrganizationOwner")
      }} className="h-11 rounded-lg border border-input bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/30">
        <option value="">{t("organizationScope")}</option>
        {restaurants.map((restaurant) => <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>)}
      </select>
      <span className="text-xs font-normal text-muted-foreground">{t("restaurantScopeHint")}</span>
    </label>}
    <ResultMessage state={state} message={state.status === "success" ? t("invitationSent") : state.error === "unauthorized" ? t("sessionRequired") : state.error === "invalid" ? t("invalidInvitation") : t("serviceError")} />
    <Button type="submit" disabled={state.status === "pending"} className="h-11 rounded-lg">{state.status === "pending" ? <LoaderCircle className="size-4 animate-spin" /> : <>{t("sendInvitationAction")}<ArrowRight className="size-4" /></>}</Button>
  </form>
}

export function AcceptInvitationForm({ token }: { token: string }) {
  const t = useTranslations("Auth")
  const router = useRouter()
  const [state, setState] = useState<ActionState>({ status: "idle" })

  async function accept() {
    setState({ status: "pending" })
    const result = await acceptStaffInvitationAction(token)
    if (result.ok) {
      setState({ status: "success" })
    } else setState({ status: "error", error: result.message })
  }

  return <div className="grid gap-4">
    <ResultMessage state={state} message={state.status === "success" ? t("invitationAccepted") : state.error === "unauthorized" ? t("sessionRequired") : state.error === "invalid" ? t("invalidInvitation") : t("serviceError")} />
    <Button type="button" onClick={() => void accept()} disabled={state.status === "pending"} className="h-11 rounded-lg">{state.status === "pending" ? <LoaderCircle className="size-4 animate-spin" /> : <>{t("acceptInvitationAction")}<ArrowRight className="size-4" /></>}</Button>
  </div>
}

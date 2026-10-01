export type ActionErrorMessage = "unauthorized" | "invalid" | "unavailable"

export type ActionResult =
  { ok: true } | { ok: false; message: ActionErrorMessage }

export type Organization = { id: string; name: string }

export type CurrentUser = {
  restaurants: { id: string; name: string; role: string }[]
}

export type Restaurant = {
  id: string
  name: string
  subdomain: string
  currency: string
}

export type ActionState = {
  status: "idle" | "pending" | "success" | "error"
  error?: string
}

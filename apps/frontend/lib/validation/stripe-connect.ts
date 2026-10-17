import { isRecord } from "./common"
import type {
  StripeConnectMode,
  StripeConnectStart,
  StripeConnectStatus,
  StripeConnectionState,
  StripeReadinessState,
} from "@/types/stripe-connect"

const modes: StripeConnectMode[] = ["test", "live"]
const connectionStates: StripeConnectionState[] = [
  "not_connected",
  "connected",
  "disconnected",
]
const readinessStates: StripeReadinessState[] = [
  "unknown",
  "onboarding",
  "action_required",
  "pending_verification",
  "restricted",
  "verified",
]

export function parseStripeConnectStatus(
  value: unknown
): StripeConnectStatus | null {
  if (!isRecord(value)) return null

  const lastVerifiedAt = value.lastVerifiedAt

  if (
    !modes.includes(value.mode as StripeConnectMode) ||
    !connectionStates.includes(value.connectionState as StripeConnectionState) ||
    !readinessStates.includes(value.readinessState as StripeReadinessState) ||
    typeof value.canManage !== "boolean" ||
    !isValidTimestamp(lastVerifiedAt)
  )
    return null

  const mode = value.mode as StripeConnectMode
  const dashboardUrl = value.dashboardUrl

  if (dashboardUrl !== null && typeof dashboardUrl !== "string") return null

  const expectedDashboard =
    mode === "test"
      ? "https://dashboard.stripe.com/test"
      : "https://dashboard.stripe.com/"

  if (dashboardUrl !== null && dashboardUrl !== expectedDashboard)
    return null

  return {
    mode,
    connectionState: value.connectionState as StripeConnectionState,
    readinessState: value.readinessState as StripeReadinessState,
    lastVerifiedAt,
    canManage: value.canManage,
    dashboardUrl,
  }
}

export function parseStripeConnectStart(value: unknown): StripeConnectStart | null {
  if (
    !isRecord(value) ||
    !modes.includes(value.mode as StripeConnectMode) ||
    typeof value.authorizationUrl !== "string"
  )
    return null

  try {
    const url = new URL(value.authorizationUrl)

    if (
      url.protocol !== "https:" ||
      url.origin !== "https://connect.stripe.com" ||
      url.pathname !== "/oauth/authorize" ||
      url.hash !== "" ||
      !url.searchParams.get("client_id")?.startsWith("ca_") ||
      url.searchParams.get("response_type") !== "code" ||
      url.searchParams.get("scope") !== "read_write" ||
      !url.searchParams.get("state") ||
      !isSafeCallback(url.searchParams.get("redirect_uri"))
    )
      return null

    return { mode: value.mode as StripeConnectMode, authorizationUrl: url.toString() }
  } catch {
    return null
  }
}

function isSafeCallback(value: string | null): boolean {
  if (!value) return false
  try {
    const url = new URL(value)

    return (
      (url.protocol === "https:" ||
        (url.protocol === "http:" && url.hostname === "localhost")) &&
      url.username === "" &&
      url.password === "" &&
      url.hash === ""
    )
  } catch {
    return false
  }
}

function isValidTimestamp(value: unknown): value is string | null {
  return (
    value === null ||
    (typeof value === "string" &&
      value.length > 0 &&
      Number.isFinite(Date.parse(value)))
  )
}

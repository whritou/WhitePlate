export type StripeConnectMode = "test" | "live"
export type StripeConnectionState = "not_connected" | "connected" | "disconnected"
export type StripeReadinessState =
  | "unknown"
  | "onboarding"
  | "action_required"
  | "pending_verification"
  | "restricted"
  | "verified"

export type StripeConnectStatus = {
  mode: StripeConnectMode
  connectionState: StripeConnectionState
  readinessState: StripeReadinessState
  lastVerifiedAt: string | null
  canManage: boolean
  dashboardUrl: string | null
}

export type StripeConnectStart = {
  mode: StripeConnectMode
  authorizationUrl: string
}

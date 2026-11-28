import type { ApiFailure } from "@/types/api"

export const unavailableActionResult: ApiFailure = {
  ok: false,
  status: 503,
  error: "unavailable",
}

/**
 * Calls a server action from a client transition and converts a rejected
 * call (network loss, server crash, stale action ID after a deployment) into
 * the caller's normal failure result. Without this, the rejection escapes the
 * transition, reaches the route error boundary and discards unsaved input.
 */
export async function settleAction<T>(
  call: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await call()
  } catch {
    return fallback
  }
}

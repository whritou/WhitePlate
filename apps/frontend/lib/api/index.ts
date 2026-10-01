import "server-only"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { createApiRequestFactory } from "./request-factory"

async function getApiToken() {
  const requestHeaders = await headers()
  const origin = requestHeaders.get("origin")
  const trustedOrigin = new URL(
    process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
  ).origin

  if (origin && origin !== trustedOrigin) return null

  const session = await auth.api.getSession({ headers: requestHeaders })

  if (!session?.user.emailVerified) return null

  return (await auth.api.getToken({ headers: requestHeaders })).token
}

export const whitePlateApi = createApiRequestFactory({
  baseUrl: () => process.env.API_BASE_URL,
  getToken: getApiToken,
  onDiagnostic: (diagnostic) =>
    console.error("WhitePlate API request failed", diagnostic),
})

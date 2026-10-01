import "server-only"
import { createJsonRequestClient } from "./json-request-client"
import type { EmailMessage } from "@/types/email"

export async function deliverEmail(message: EmailMessage): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL

  if (!apiKey || !from) return false

  const client = createJsonRequestClient()
  const response = await client.request("https://api.resend.com/emails", {
    method: "POST",
    responseType: "none",
    bearerToken: apiKey,
    body: { from, ...message },
    signal: AbortSignal.timeout(15_000),
  })

  return response.ok
}

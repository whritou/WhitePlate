import "server-only"
import type { EmailMessage } from "@/types/email"

export async function deliverEmail(message: EmailMessage): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) return false
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, ...message }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    })
    return response.ok
  } catch {
    return false
  }
}

"use client"

import { useState, type FormEvent } from "react"
import { browserRequest } from "@/lib/api/browser-request"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslations } from "next-intl"

export function AnalyticsWithdrawalForm({ tenantId }: { tenantId: string }) {
  const t = useTranslations("AnalyticsPrivacy")
  const [email, setEmail] = useState("")
  const [pending, setPending] = useState(false)
  const [state, setState] = useState<"idle" | "success" | "error">("idle")

  async function withdraw(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setState("idle")
    try {
      const result = await browserRequest<{ ok: boolean }>("/api/public/analytics-withdrawal", {
        method: "POST",
        body: { tenantId, email: email.trim() },
      })

      if (!result.ok || !result.data?.ok) {
        setState("error")

        return
      }

      setEmail("")
      setState("success")
    } catch {
      setState("error")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="grid gap-3">
      <div>
        <h3 className="font-semibold">{t("withdrawTitle")}</h3>

        <p className="mt-1 text-sm text-muted-foreground">{t("withdrawDescription")}</p>
      </div>

      <form onSubmit={withdraw} className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Label className="grid gap-1.5 text-sm font-medium" htmlFor={`analytics-withdrawal-${tenantId}`}>
          {t("emailLabel")}

          <Input
            id={`analytics-withdrawal-${tenantId}`}
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            value={email}
            onChange={event => setEmail(event.target.value)}
          />
        </Label>

        <Button className="self-end" type="submit" variant="outline" disabled={pending}>
          {pending ? t("withdrawing") : t("withdrawAction")}
        </Button>
      </form>

      {state !== "idle" && (
        <Alert variant={state === "success" ? "info" : "destructive"} role="status">
          <AlertDescription>{t(state === "success" ? "withdrawSuccess" : "withdrawError")}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

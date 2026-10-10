"use client"
import { useMessages, useTranslations } from "next-intl"
import { useMemo, type ReactNode } from "react"
export function useLovableText() {
  const messages = useMessages()
  const t = useTranslations("Lovable")
  const lookup = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(
          (messages.LovableOriginal ?? {}) as Record<string, string>
        ).map(([key, value]) => [value, key])
      ),
    [messages]
  )

  return (value: string | undefined) => {
    if (!value) return value

    const invitation = value.match(
      /^Demo invitation saved for (.+); no email was sent$/
    )

    if (invitation) return t("demoInvitation", { email: invitation[1] })

    const invitations = value.match(/^Invitations \((\d+)\)$/)

    if (invitations) return t("invitations", { count: invitations[1] })

    const missing = value.match(/^(\d+) missing$/)

    if (missing) return t("missing", { count: missing[1] })

    const annual = value.match(/^Billed annually: €(.+)$/)

    if (annual) return t("annualAmount", { amount: annual[1] })

    const minimum = value.match(/^Minimum order €(.+)$/)

    if (minimum) return t("minimumAmount", { amount: minimum[1] })

    const sites = value.match(/^Up to (\d+)$/)

    if (sites) return t("upTo", { count: sites[1] })

    const key = lookup[value.replace(/\s+/g, " ").trim()]

    return key
      ? `${value.match(/^\s*/)?.[0] ?? ""}${t(key)}${value.match(/\s*$/)?.[0] ?? ""}`
      : value
  }
}

export function Copy({ children }: { children?: ReactNode }) {
  const text = useLovableText()
  const translate = (value: ReactNode): ReactNode =>
    Array.isArray(value)
      ? value.map(translate)
      : typeof value === "string"
        ? text(value)
        : value

  return translate(children)
}

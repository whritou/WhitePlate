"use client"

import { useLocale, useTranslations } from "next-intl"
import { useState, useRef, type FormEvent } from "react"
import { authClient } from "@/lib/auth-client"
import type { AuthFormProps } from "@/types/auth"

export function useAuthForm({ mode, inviteToken, resetToken }: AuthFormProps) {
  const locale = useLocale()
  const t = useTranslations("Auth")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const inFlight = useRef(false)
  const [pending, setPending] = useState(false)

  const callbackPath = inviteToken
    ? `/${locale}/invitations/accept?token=${encodeURIComponent(inviteToken)}`
    : `/${locale}/organization`

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current) return
    inFlight.current = true
    setError("")
    setSuccess("")
    setPending(true)
    const form = new FormData(event.currentTarget)
    const email = String(form.get("email") ?? "")
    const password = String(form.get("password") ?? "")
    try {
      if (mode === "signUp") {
        const result = await authClient.signUp.email({
          name: String(form.get("name") ?? ""),
          email,
          password,
          callbackURL: inviteToken ? callbackPath : `/${locale}/verify-email`,
        })
        if (result.error) throw result.error
        setSuccess(t("verificationSent"))
      } else if (mode === "signIn") {
        const result = await authClient.signIn.email({
          email,
          password,
          callbackURL: callbackPath,
        })
        if (result.error) throw result.error
        window.location.assign(callbackPath)
      } else if (mode === "forgot") {
        const result = await authClient.requestPasswordReset({
          email,
          redirectTo: `${window.location.origin}/${locale}/reset-password`,
        })
        if (result.error) throw result.error
        setSuccess(t("resetRequested"))
      } else if (mode === "reset") {
        if (!resetToken) throw new Error("missing_token")
        if (password !== String(form.get("confirmPassword") ?? ""))
          throw new Error("password_mismatch")
        const result = await authClient.resetPassword({
          newPassword: password,
          token: resetToken,
        })
        if (result.error) throw result.error
        setSuccess(t("passwordUpdated"))
      }
    } catch {
      setError(t("formError"))
    } finally {
      inFlight.current = false
      setPending(false)
    }
  }

  async function signInSocial(provider: "google" | "microsoft") {
    setPending(true)
    setError("")
    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: `${window.location.origin}${callbackPath}`,
      })
      if (result.error) throw result.error
    } catch {
      setError(t("providerError"))
      setPending(false)
    }
  }

  return { error, success, pending, submit, signInSocial }
}

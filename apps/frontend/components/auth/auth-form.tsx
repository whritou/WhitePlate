"use client"

import { useState, type FormEvent } from "react"
import { useLocale, useTranslations } from "next-intl"
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, UtensilsCrossed } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

type AuthMode = "signIn" | "signUp" | "forgot" | "reset"

function AuthFrame({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <main className="min-h-[calc(100vh-8rem)] bg-background px-5 py-10 sm:px-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(24rem,28rem)] lg:items-center lg:gap-16 lg:px-16 lg:py-14">
      <section className="mx-auto w-full max-w-[27rem] lg:order-2">{children}</section>
      <aside className="mx-auto mt-10 hidden w-full max-w-2xl lg:order-1 lg:block">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-secondary px-10 py-12 xl:px-14 xl:py-16">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border-[36px] border-primary/10" aria-hidden="true" />
          <UtensilsCrossed className="mb-8 size-7 text-primary" aria-hidden="true" />
          {aside}
        </div>
      </aside>
    </main>
  )
}

function AuthHeading({ title, description }: { title: string; description: string }) {
  return (
    <header className="mb-7">
      <p className="mb-2 text-sm font-medium text-primary">WhitePlate</p>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </header>
  )
}

function AuthField({
  id, label, type = "text", autoComplete, required = true, icon,
}: { id: string; label: string; type?: string; autoComplete?: string; required?: boolean; icon?: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-foreground" htmlFor={id}>
      {label}
      <span className="relative">
        {icon && <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-muted-foreground">{icon}</span>}
        <input id={id} name={id} type={type} autoComplete={autoComplete} required={required} className={`h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 ${icon ? "ps-10" : ""}`} />
      </span>
    </label>
  )
}

export function AuthForm({
  mode,
  googleEnabled,
  microsoftEnabled,
  inviteToken,
  resetToken,
  resetInvalid = false,
}: {
  mode: AuthMode
  googleEnabled: boolean
  microsoftEnabled: boolean
  inviteToken?: string
  resetToken?: string
  resetInvalid?: boolean
}) {
  const locale = useLocale()
  const t = useTranslations("Auth")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [pending, setPending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const callbackPath = inviteToken
    ? `/${locale}/invitations/accept?token=${encodeURIComponent(inviteToken)}`
    : `/${locale}/organization`

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
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
        const result = await authClient.signIn.email({ email, password, callbackURL: callbackPath })
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
        if (password !== String(form.get("confirmPassword") ?? "")) throw new Error("password_mismatch")
        const result = await authClient.resetPassword({ newPassword: password, token: resetToken })
        if (result.error) throw result.error
        setSuccess(t("passwordUpdated"))
      }
    } catch {
      setError(t("formError"))
    } finally {
      setPending(false)
    }
  }

  async function signInSocial(provider: "google" | "microsoft") {
    setPending(true)
    setError("")
    try {
      const result = await authClient.signIn.social({ provider, callbackURL: `${window.location.origin}${callbackPath}` })
      if (result.error) throw result.error
    } catch {
      setError(t("providerError"))
      setPending(false)
    }
  }

  const heading = mode === "signIn"
    ? [t("signInTitle"), t("signInDescription")]
    : mode === "signUp"
      ? [t("signUpTitle"), t("signUpDescription")]
      : mode === "forgot"
        ? [t("forgotTitle"), t("forgotDescription")]
        : [t("resetTitle"), t("resetDescription")]

  return (
    <AuthFrame aside={<>
      <p className="mb-4 text-sm font-medium text-primary">{t("asideEyebrow")}</p>
      <p className="max-w-xl text-4xl font-semibold leading-tight tracking-tight text-foreground xl:text-5xl">{t("asideTitle")}</p>
      <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">{t("asideDescription")}</p>
      <div className="mt-10 flex items-center gap-3 text-sm text-muted-foreground"><span className="flex size-9 items-center justify-center rounded-full bg-background text-primary"><LockKeyhole className="size-4" /></span>{t("asideNote")}</div>
    </>}>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <AuthHeading title={heading[0]} description={heading[1]} />
        {(mode === "signIn" || mode === "signUp") && (googleEnabled || microsoftEnabled) && (
          <div className="grid gap-3">
            {googleEnabled && <Button type="button" variant="outline" disabled={pending} className="h-11 w-full rounded-lg text-sm" onClick={() => void signInSocial("google")}>{t("continueGoogle")}</Button>}
            {microsoftEnabled && <Button type="button" variant="outline" disabled={pending} className="h-11 w-full rounded-lg text-sm" onClick={() => void signInSocial("microsoft")}>{t("continueMicrosoft")}</Button>}
          </div>
        )}
        {(mode === "signIn" || mode === "signUp") && (googleEnabled || microsoftEnabled) && <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />{t("orEmail")}<span className="h-px flex-1 bg-border" /></div>}
        {mode === "reset" && resetInvalid ? <div className="grid gap-4">
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{t("resetInvalid")}</p>
          <Link href="/forgot-password" className="text-sm font-medium text-primary underline-offset-4 hover:underline">{t("forgotLink")}</Link>
        </div> : <form className="grid gap-4" onSubmit={submit}>
          {mode === "signUp" && <AuthField id="name" label={t("name")} autoComplete="name" />}
          {mode !== "reset" && <AuthField id="email" label={t("email")} type="email" autoComplete="email" icon={<Mail className="size-4" />} />}
          {(mode === "signIn" || mode === "signUp" || mode === "reset") && <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground" htmlFor="password">{mode === "reset" ? t("newPassword") : t("password")}</label>
            <span className="relative">
              <LockKeyhole className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" aria-hidden="true" />
              <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "signIn" ? "current-password" : "new-password"} minLength={8} maxLength={128} required className="h-11 w-full rounded-lg border border-input bg-background px-10 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" />
              <button type="button" aria-label={showPassword ? t("hidePassword") : t("showPassword")} className="absolute inset-y-0 end-3 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
            </span>
          </div>}
          {mode === "reset" && <AuthField id="confirmPassword" label={t("confirmPassword")} type="password" autoComplete="new-password" />}
          {mode === "signIn" && <div className="-mt-1 text-end"><Link href="/forgot-password" className="text-sm text-primary underline-offset-4 hover:underline">{t("forgotLink")}</Link></div>}
          {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
          {success && <p role="status" className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">{success}</p>}
          <Button type="submit" disabled={pending} className="mt-1 h-11 w-full rounded-lg text-sm">
            {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <>{mode === "signIn" ? t("signInAction") : mode === "signUp" ? t("signUpAction") : mode === "forgot" ? t("sendResetAction") : t("resetAction")}<ArrowRight className="size-4" aria-hidden="true" /></>}
          </Button>
        </form>}
        {(mode === "signIn" || mode === "signUp") && <p className="mt-6 text-center text-sm text-muted-foreground">{mode === "signIn" ? t("noAccount") : t("hasAccount")} <Link href={mode === "signIn" ? "/sign-up" : "/sign-in"} className="font-medium text-primary underline-offset-4 hover:underline">{mode === "signIn" ? t("signUpAction") : t("signInAction")}</Link></p>}
        {(mode === "forgot" || mode === "reset") && <p className="mt-6 text-center text-sm text-muted-foreground"><Link href="/sign-in" className="font-medium text-primary underline-offset-4 hover:underline">{t("backToSignIn")}</Link></p>}
      </div>
    </AuthFrame>
  )
}

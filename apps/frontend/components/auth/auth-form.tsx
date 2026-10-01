"use client"

import { Alert } from "@/components/ui/alert"

import { ArrowRight, LoaderCircle, LockKeyhole, Mail } from "lucide-react"
import { useTranslations } from "next-intl"
import { AuthField } from "@/components/auth/auth-field"
import { AuthFrame } from "@/components/auth/auth-frame"
import { AuthHeading } from "@/components/auth/auth-heading"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { PasswordField } from "./password-field"
import { Separator } from "@/components/ui/separator"
import { useAuthForm } from "@/hooks/use-auth-form"
import type { AuthFormProps } from "@/types/auth"

export function AuthForm({
  mode,
  googleEnabled,
  microsoftEnabled,
  inviteToken,
  resetToken,
  resetInvalid = false,
}: AuthFormProps) {
  const t = useTranslations("Auth")
  const { error, success, pending, submit, signInSocial } = useAuthForm({
    mode,
    googleEnabled,
    microsoftEnabled,
    inviteToken,
    resetToken,
    resetInvalid,
  })

  const heading =
    mode === "signIn"
      ? [t("signInTitle"), t("signInDescription")]
      : mode === "signUp"
        ? [t("signUpTitle"), t("signUpDescription")]
        : mode === "forgot"
          ? [t("forgotTitle"), t("forgotDescription")]
          : [t("resetTitle"), t("resetDescription")]

  return (
    <AuthFrame
      aside={
        <>
          <p className="mb-4 text-sm font-medium text-primary">
            {t("asideEyebrow")}
          </p>
          <p className="max-w-xl text-4xl leading-tight font-semibold tracking-tight text-foreground xl:text-5xl">
            {t("asideTitle")}
          </p>
          <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">
            {t("asideDescription")}
          </p>
          <div className="mt-10 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex size-9 items-center justify-center rounded-full bg-background text-primary">
              <LockKeyhole className="size-4" />
            </span>
            {t("asideNote")}
          </div>
        </>
      }
    >
      <Card className="gap-0 rounded-2xl p-6 text-sm sm:p-8">
        <AuthHeading title={heading[0]} description={heading[1]} />
        {(mode === "signIn" || mode === "signUp") &&
          (googleEnabled || microsoftEnabled) && (
            <div className="grid gap-3">
              {googleEnabled && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  className="h-11 w-full rounded-lg text-sm"
                  onClick={() => void signInSocial("google")}
                >
                  {t("continueGoogle")}
                </Button>
              )}
              {microsoftEnabled && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  className="h-11 w-full rounded-lg text-sm"
                  onClick={() => void signInSocial("microsoft")}
                >
                  {t("continueMicrosoft")}
                </Button>
              )}
            </div>
          )}
        {(mode === "signIn" || mode === "signUp") &&
          (googleEnabled || microsoftEnabled) && (
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <Separator className="flex-1" />
              {t("orEmail")}
              <Separator className="flex-1" />
            </div>
          )}
        {mode === "reset" && resetInvalid ? (
          <div className="grid gap-4">
            <Alert
              variant="destructive"
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {t("resetInvalid")}
            </Alert>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("forgotLink")}
            </Link>
          </div>
        ) : (
          <form className="grid gap-4" onSubmit={submit}>
            {mode === "signUp" && (
              <AuthField id="name" label={t("name")} autoComplete="name" />
            )}
            {mode !== "reset" && (
              <AuthField
                id="email"
                label={t("email")}
                type="email"
                autoComplete="email"
                icon={<Mail className="size-4" />}
              />
            )}
            {(mode === "signIn" || mode === "signUp" || mode === "reset") && (
              <PasswordField mode={mode} />
            )}
            {mode === "reset" && (
              <AuthField
                id="confirmPassword"
                label={t("confirmPassword")}
                type="password"
                autoComplete="new-password"
              />
            )}
            {mode === "signIn" && (
              <div className="-mt-1 text-end">
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  {t("forgotLink")}
                </Link>
              </div>
            )}
            {error && (
              <Alert
                variant="destructive"
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </Alert>
            )}
            {success && (
              <Alert
                role="status"
                className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground"
              >
                {success}
              </Alert>
            )}
            <Button
              type="submit"
              disabled={pending}
              className="mt-1 h-11 w-full rounded-lg text-sm"
            >
              {pending ? (
                <LoaderCircle
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <>
                  {mode === "signIn"
                    ? t("signInAction")
                    : mode === "signUp"
                      ? t("signUpAction")
                      : mode === "forgot"
                        ? t("sendResetAction")
                        : t("resetAction")}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </>
              )}
            </Button>
          </form>
        )}
        {(mode === "signIn" || mode === "signUp") && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signIn" ? t("noAccount") : t("hasAccount")}{" "}
            <Link
              href={mode === "signIn" ? "/sign-up" : "/sign-in"}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {mode === "signIn" ? t("signUpAction") : t("signInAction")}
            </Link>
          </p>
        )}
        {(mode === "forgot" || mode === "reset") && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link
              href="/sign-in"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("backToSignIn")}
            </Link>
          </p>
        )}
      </Card>
    </AuthFrame>
  )
}

"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"

import { AuthField } from "@/components/auth/auth-field"
import { AuthFrame } from "@/components/auth/auth-frame"
import { AuthHeading } from "@/components/auth/auth-heading"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useAuthForm } from "@/hooks/use-auth-form"
import { Link } from "@/i18n/navigation"
import type { AuthFormProps } from "@/types/auth"
import { ArrowRight, LoaderCircle, ShieldCheck } from "lucide-react"
import { useTranslations } from "next-intl"
import { PasswordField } from "./password-field"

export function AuthForm({
  mode,
  googleEnabled,
  microsoftEnabled,
  inviteToken,
  resetToken,
  resetInvalid = false,
}: AuthFormProps) {
  const t = useTranslations("Auth")
  const visual = useTranslations("LovableLive")
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
      ? [visual("signInTitle"), visual("signInDescription")]
      : mode === "signUp"
        ? [visual("signUpTitle"), visual("signUpDescription")]
        : mode === "forgot"
          ? [t("forgotTitle"), t("forgotDescription")]
          : [t("resetTitle"), t("resetDescription")]

  return (
    <AuthFrame aside={<span />}>
      <Card className="gap-0 border-0 bg-transparent p-0 text-sm shadow-none">
        <AuthHeading title={heading[0]} description={heading[1]} />

        <CardContent className="px-0">
          {(mode === "signIn" || mode === "signUp") &&
            (googleEnabled || microsoftEnabled) && (
              <div className="mt-8 grid gap-3">
                {googleEnabled && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pending}
                    className="w-full"
                    onClick={() => void signInSocial("google")}
                  >
                    <span className="text-lg font-bold" aria-hidden="true">
                      G
                    </span>

                    {t("continueGoogle")}
                  </Button>
                )}

                {microsoftEnabled && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pending}
                    className="w-full"
                    onClick={() => void signInSocial("microsoft")}
                  >
                    {t("continueMicrosoft")}
                  </Button>
                )}
              </div>
            )}

          {(mode === "signIn" || mode === "signUp") &&
            (googleEnabled || microsoftEnabled) && (
              <div className="my-6 flex items-center gap-4 text-xs text-muted-foreground">
                <Separator className="flex-1 bg-border/20" />

                {t("orEmail")}

                <Separator className="flex-1 bg-border/20" />
              </div>
            )}

          {mode === "reset" && resetInvalid ? (
            <div className="grid gap-4">
              <Alert variant="destructive" role="alert">
                <AlertDescription>{t("resetInvalid")}</AlertDescription>
              </Alert>

              <Link
                href="/forgot-password"
                className="text-sm font-medium text-brand-text underline-offset-4 hover:underline"
              >
                {t("forgotLink")}
              </Link>
            </div>
          ) : (
            <form className="mt-6 grid gap-5" onSubmit={submit}>
              {mode === "signUp" && (
                <AuthField
                  id="name"
                  label={t("name")}
                  autoComplete="name"
                  placeholder={visual("namePlaceholder")}
                />
              )}

              {mode !== "reset" && (
                <AuthField
                  id="email"
                  label={t("email")}
                  type="email"
                  autoComplete="email"
                  placeholder="you@restaurant.com"
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

              {error && (
                <Alert variant="destructive" role="alert">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert variant="success" role="status">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" disabled={pending} className="mt-1 w-full">
                {pending ? (
                  <LoaderCircle
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <>
                    {mode === "signIn"
                      ? visual("signInAction")
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
                className="font-medium text-brand-text underline-offset-4 hover:underline"
              >
                {mode === "signIn" ? t("signUpAction") : t("signInAction")}
              </Link>
            </p>
          )}

          {(mode === "forgot" || mode === "reset") && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link
                href="/sign-in"
                className="font-medium text-brand-text underline-offset-4 hover:underline"
              >
                {t("backToSignIn")}
              </Link>
            </p>
          )}

          <p className="mt-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4" />

            {visual("secureAccess")}
          </p>
        </CardContent>
      </Card>
    </AuthFrame>
  )
}

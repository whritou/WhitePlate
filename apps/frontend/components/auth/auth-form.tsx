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
import { ArrowRight, LoaderCircle, LockKeyhole, Mail } from "lucide-react"
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

          <p className="max-w-[36rem] text-4xl leading-tight font-semibold tracking-tight text-foreground xl:text-5xl">
            {t("asideTitle")}
          </p>

          <p className="mt-5 max-w-[28rem] text-base leading-7 text-muted-foreground">
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
      <Card className="gap-0 rounded-lg p-6 text-sm sm:p-8">
        <AuthHeading title={heading[0]} description={heading[1]} />

        <CardContent className="px-0">
          {(mode === "signIn" || mode === "signUp") &&
            (googleEnabled || microsoftEnabled) && (
              <div className="grid gap-3">
                {googleEnabled && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pending}
                    className="w-full"
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
              <div className="my-5 flex items-center gap-3 text-sm text-muted-foreground">
                <Separator className="flex-1" />

                {t("orEmail")}

                <Separator className="flex-1" />
              </div>
            )}

          {mode === "reset" && resetInvalid ? (
            <div className="grid gap-4">
              <Alert variant="destructive" role="alert">
                <AlertDescription>{t("resetInvalid")}</AlertDescription>
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
        </CardContent>
      </Card>
    </AuthFrame>
  )
}

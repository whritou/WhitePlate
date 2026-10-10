"use client"

import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AuthMode } from "@/types/auth"
import { Eye, EyeOff } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

export function PasswordField({ mode }: { mode: AuthMode }) {
  const t = useTranslations("Auth")
  const visual = useTranslations("LovableLive")
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label className="font-medium text-foreground" htmlFor="password">
          {mode === "reset" ? t("newPassword") : t("password")}
        </Label>

        {mode === "signIn" && (
          <Link
            href="/forgot-password"
            className="text-xs text-primary hover:underline"
          >
            {t("forgotLink")}
          </Link>
        )}
      </div>

      <span className="relative">
        <Input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete={mode === "signIn" ? "current-password" : "new-password"}
          placeholder={
            mode === "signIn"
              ? visual("passwordPlaceholder")
              : visual("newPasswordPlaceholder")
          }
          minLength={8}
          maxLength={128}
          required
          className="w-full pe-12"
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={showPassword ? t("hidePassword") : t("showPassword")}
          className="absolute end-0 top-1/2 -translate-y-1/2 text-muted-foreground"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="size-4" />
          ) : (
            <Eye className="size-4" />
          )}
        </Button>
      </span>
    </div>
  )
}

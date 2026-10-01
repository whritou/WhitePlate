"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AuthMode } from "@/types/auth"
import { Eye, EyeOff, LockKeyhole } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

export function PasswordField({ mode }: { mode: AuthMode }) {
  const t = useTranslations("Auth")
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="grid gap-2">
      <Label className="text-sm font-medium text-foreground" htmlFor="password">
        {mode === "reset" ? t("newPassword") : t("password")}
      </Label>

      <span className="relative">
        <LockKeyhole
          className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground"
          aria-hidden="true"
        />

        <Input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete={mode === "signIn" ? "current-password" : "new-password"}
          minLength={8}
          maxLength={128}
          required
          className="h-11 w-full rounded-lg border border-input bg-background px-10 text-sm transition outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={showPassword ? t("hidePassword") : t("showPassword")}
          className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground"
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

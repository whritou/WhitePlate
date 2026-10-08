"use client"

import { Palette } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"

export function ThemeCustomizer({
  theme,
  onChange,
}: {
  theme: string
  onChange: (theme: string) => void
}) {
  const t = useTranslations("Redesign")

  return (
    <div className="bg-muted">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
        <p className="flex min-w-0 flex-wrap items-center gap-2 text-xs">
          <Palette
            aria-hidden="true"
            className="size-5 shrink-0 text-primary"
          />

          <strong>{t("tenantEngine")}</strong>

          <span className="hidden text-muted-foreground md:inline">
            {t("template")}
          </span>
        </p>

        <div
          role="group"
          aria-label={t("themeHue")}
          className="flex flex-wrap items-center gap-1"
        >
          <span className="mr-2 text-xs text-muted-foreground">
            {t("themeHue")}
          </span>

          {["orange", "emerald", "obsidian", "berry"].map((color) => (
            <Button
              key={color}
              size="icon"
              variant="ghost"
              aria-label={t(`theme${color}`)}
              aria-pressed={theme === color}
              onClick={() => onChange(color)}
              className="size-11"
            >
              <span
                className={`size-5 rounded-full outline-offset-2 ${theme === color ? "outline-2 outline-foreground" : "opacity-65"} theme-swatch-${color}`}
              />
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

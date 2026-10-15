"use client"
import { useTranslations } from "next-intl"
import { StudioPage } from "@/components/lovable/pages/studio"
import { Button } from "@/components/ui/button"
import { useTenantTheme } from "@/hooks/use-tenant-theme"
import type { LiveStudioProps } from "@/types/theme"

export function LiveThemeStudio(props: LiveStudioProps) {
  const controller = useTenantTheme(props)
  const t = useTranslations("ThemeStudio")

  return (
    <>
      <div className="border-b bg-secondary px-6 py-2">
        <p className="text-xs text-muted-foreground" role="status">
          {controller.notice}
        </p>

        {controller.canReload && (
          <Button
            variant="link"
            onClick={controller.reload}
            disabled={controller.saving}
          >
            {t("reload")}
          </Button>
        )}
      </div>

      {!controller.hidden && <StudioPage controller={controller} />}
    </>
  )
}

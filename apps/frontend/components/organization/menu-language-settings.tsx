"use client"

import { Globe2, Languages } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { EditorDialog } from "@/components/ui/editor-dialog"
import type { MenuLanguageSettings as Settings } from "@/types/catalog"
import { MenuLanguageSettingsForm } from "./menu-language-settings-form"

export function MenuLanguageSettings(props: Settings) {
  const t = useTranslations("Auth")
  const u = useTranslations("MenuTranslations")
  const locale = useLocale()
  const names = new Intl.DisplayNames([locale], { type: "language" })

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <CardTitle>
            <h2 className="flex items-center gap-2">
              <Globe2 aria-hidden="true" className="size-5" />

              {t("menuLanguagesEnabled")}
            </h2>
          </CardTitle>

          <CardDescription className="mt-2">
            {u("settingsHelp")}
          </CardDescription>
        </div>

        <EditorDialog
          icon={Languages}
          title={u("manageLanguages")}
          label={u("manageLanguages")}
          description={t("menuLanguagesHint")}
        >
          {(callbacks) => (
            <MenuLanguageSettingsForm {...props} {...callbacks} />
          )}
        </EditorDialog>
      </CardHeader>

      <CardContent>
        <ul className="flex flex-wrap gap-3">
          {props.locales.map((value) => (
            <li
              key={value}
              className="flex flex-wrap items-center gap-3 rounded-md border border-border px-4 py-3"
            >
              <span className="font-medium">{names.of(value) ?? value}</span>

              <span className="text-sm text-muted-foreground">{value}</span>

              {value === props.defaultLocale && (
                <Badge variant="neutral">{t("defaultMenuLanguage")}</Badge>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

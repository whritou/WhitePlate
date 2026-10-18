"use client"
import { useTranslations } from "next-intl"
import { Alert, AlertDescription } from "@/components/ui/alert"
export function MissingFeatureNotice() {
  const t = useTranslations("LiveWorkspace")

  return (
    <Alert role="status" className="border border-primary bg-secondary">
      <AlertDescription>{t("sampleNotice")}</AlertDescription>
    </Alert>
  )
}

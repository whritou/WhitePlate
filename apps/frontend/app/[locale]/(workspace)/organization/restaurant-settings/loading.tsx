import { getTranslations } from "next-intl/server"
import { Skeleton } from "@/components/ui/skeleton"

export default async function Loading() {
  const t = await getTranslations("EstablishmentSettings")

  return (
    <main className="live-page grid gap-6" role="status">
      <p>{t("loading")}</p>

      <Skeleton className="h-12 w-full" />

      <Skeleton className="h-64 w-full" />
    </main>
  )
}

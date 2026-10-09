import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getTranslations } from "next-intl/server"

export default async function ThemingLoading() {
  const t = await getTranslations("BrandAssets")

  return (
    <main
      className="mx-auto w-full max-w-[100rem] p-4 sm:p-6 lg:p-8"
      aria-busy="true"
    >
      <p role="status" className="mb-4 text-sm text-muted-foreground">
        {t("loading")}
      </p>

      <Skeleton className="mb-6 h-10 w-64 max-w-full" />

      <div className="grid gap-6 xl:grid-cols-2">
        {[0, 1].map((key) => (
          <Card key={key}>
            <CardContent className="grid gap-4 p-6">
              <Skeleton className="h-12 w-full" />

              <Skeleton className="h-72 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}

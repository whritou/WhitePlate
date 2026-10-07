import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { FileQuestion, Home } from "lucide-react"
import { getTranslations } from "next-intl/server"

export default async function NotFoundPage() {
  const t = await getTranslations("StatusPages")

  return (
    <main className="grid min-h-[70vh] place-items-center p-4 sm:p-6">
      <Card className="w-full max-w-xl p-6 sm:p-10">
        <CardHeader className="px-0">
          <FileQuestion
            aria-hidden="true"
            className="mb-4 size-9 text-primary"
          />

          <CardTitle>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-[2rem]">
              {t("notFoundTitle")}
            </h1>
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-5 px-0">
          <p className="max-w-prose text-sm leading-6 text-muted-foreground">
            {t("notFoundDescription")}
          </p>

          <Button
            className="w-fit"
            nativeButton={false}
            render={<Link href="/" />}
          >
            <Home aria-hidden="true" />

            {t("home")}
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}

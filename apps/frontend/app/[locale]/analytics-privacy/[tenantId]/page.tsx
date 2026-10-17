import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { AnalyticsWithdrawalForm } from "@/components/storefront/analytics-withdrawal-form"
import { isUuid } from "@/lib/checkout/cart"
import { Link } from "@/i18n/navigation"

export default async function AnalyticsPrivacyPage({
  params,
}: {
  params: Promise<{ tenantId: string }>
}) {
  const { tenantId } = await params

  if (!isUuid(tenantId)) notFound()

  const t = await getTranslations("AnalyticsPrivacy")

  return (
    <main className="mx-auto grid min-h-svh max-w-2xl content-start gap-6 px-6 py-12">
      <header className="grid gap-2">
        <p className="label-mono text-muted-foreground">WhitePlate</p>

        <h1 className="font-display text-3xl font-bold">{t("pageTitle")}</h1>

        <p className="text-muted-foreground">{t("pageDescription")}</p>
      </header>

      <section className="card-hard grid gap-5 bg-background p-5 sm:p-6">
        <AnalyticsWithdrawalForm tenantId={tenantId} />
      </section>

      <Link
        className="min-h-11 text-sm underline-offset-4 hover:underline"
        href="/"
      >
        {t("backToRestaurant")}
      </Link>
    </main>
  )
}

"use client"

import { ArrowLeft } from "lucide-react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { VisualScopeProvider } from "@/components/ui/visual-scope"

export function AuthFrame({
  children,
  aside,
}: {
  children: React.ReactNode
  aside?: React.ReactNode
}) {
  const t = useTranslations("LovableLive")

  return (
    <VisualScopeProvider value={{ className: "lovable-surface lovable-live" }}>
      <div className="lovable-surface lovable-live lovable-auth min-h-screen bg-background text-foreground">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-5 md:px-10">
          <Link href="/" className="font-display text-2xl font-bold">
            White<span className="text-primary">Plate</span>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            render={<Link href="/" />}
            nativeButton={false}
          >
            <ArrowLeft />

            {t("backHome")}
          </Button>
        </header>

        <main
          className={`mx-auto grid min-h-[calc(100vh-81px)] ${aside ? "max-w-7xl lg:grid-cols-2" : "max-w-lg"}`}
        >
          <section className="flex min-w-0 items-center justify-center px-6 py-14 md:px-14">
            <div className="w-full max-w-sm">{children}</div>
          </section>

          {aside && (
            <aside className="relative hidden min-h-[660px] overflow-hidden border-l lg:block">
              <Image
                src="/lovable/hero.jpg"
                alt={t("authImage")}
                fill
                sizes="50vw"
                className="object-cover"
                priority
              />

              <div className="absolute inset-x-0 bottom-0 border-t bg-ink p-10 text-ink-foreground">
                <span className="inline-block bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                  {t("authBrand")}
                </span>

                <h2 className="mt-5 font-display text-4xl leading-tight font-bold tracking-normal">
                  {t("authFutureFirst")}

                  <br />

                  {t("authFutureSecond")}
                </h2>

                <p className="mt-4 max-w-sm text-sm text-ink-foreground/75">
                  {t("authTagline")}
                </p>
              </div>
            </aside>
          )}
        </main>
      </div>
    </VisualScopeProvider>
  )
}

"use client"

import { useState } from "react"
import { Languages, TicketPercent, UtensilsCrossed } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { EditorDialog } from "@/components/ui/editor-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import type { MenuBuilderProps, MenuBuilderView } from "@/types/menu-builder"
import { MenuBuilderCatalog } from "./menu-builder-catalog"
import { MenuLanguageSettings } from "./menu-language-settings"
import { CatalogTranslationsEditor } from "./catalog-translations-editor"
import { RestaurantDescriptionEditor } from "./restaurant-description-editor"
import { DiscountsEditor } from "./discounts-editor"
import styles from "./menu-builder.module.css"

export function MenuBuilderWorkspace({
  userId,
  catalog,
  restaurantName,
  settings,
  description,
  initialView = "products",
}: MenuBuilderProps) {
  const t = useTranslations("MenuBuilder")
  const u = useTranslations("CatalogView")
  const router = useRouter()
  const [view, setView] = useState<MenuBuilderView>(initialView)
  const [pending, setPending] = useState(false)

  function changeView(value: unknown) {
    if (pending || (value !== "products" && value !== "translations")) return

    setView(value)

    const url = new URL(window.location.href)

    url.searchParams.set("view", value)
    window.history.replaceState(null, "", url.pathname + url.search + url.hash)
  }

  return (
    <Tabs
      className={`${styles.workspace} @container`}
      value={view}
      onValueChange={changeView}
    >
      <header className="grid min-w-0 items-start gap-6 pb-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)]">
        <div className="min-w-0">
          <p className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium tracking-wider uppercase">
            <span>{t("management")}</span>

            <span className="text-brand-text">{t("localizationStudio")}</span>
          </p>

          <h1 className="max-w-[25rem] font-heading text-[1.75rem] leading-tight font-bold tracking-tight sm:text-[2.25rem]">
            {t("title")}
          </h1>

          {restaurantName && (
            <p className="mt-3 text-sm text-muted-foreground">
              {restaurantName}
            </p>
          )}
        </div>

        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] justify-items-start gap-4 xl:justify-items-end">
          <TabsList
            aria-label={t("sections")}
            className="w-full bg-secondary p-1.5"
          >
            <TabsTrigger
              value="products"
              disabled={pending}
              className="grow flex-wrap data-active:border-transparent data-active:shadow-sm"
            >
              <UtensilsCrossed aria-hidden="true" className="size-4 shrink-0" />

              {t("products")}
            </TabsTrigger>

            <TabsTrigger
              value="translations"
              disabled={pending}
              aria-description={
                settings
                  ? t("languageCount", { count: settings.locales.length })
                  : undefined
              }
              className="grow flex-wrap data-active:border-transparent data-active:shadow-sm"
            >
              <Languages aria-hidden="true" className="size-4 shrink-0" />

              {t("translations")}

              {settings && (
                <span
                  aria-hidden="true"
                  className="rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground"
                >
                  {t("languageCount", { count: settings.locales.length })}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <EditorDialog
            title={u("discounts")}
            label={u("discounts")}
            icon={TicketPercent}
            description={t("discountsHelp")}
            disabled={pending}
          >
            {() => (
              <DiscountsEditor
                tenantId={catalog.tenantId}
                currency={catalog.currency}
                discounts={catalog.discounts}
              />
            )}
          </EditorDialog>

          <p className="max-w-[40rem] text-sm text-muted-foreground xl:text-right">
            {t("saveHelp")}
          </p>
        </div>
      </header>

      <TabsContent value="products" keepMounted>
        <MenuBuilderCatalog
          userId={userId}
          catalog={catalog}
          settings={settings}
          pending={pending}
          onPendingChange={setPending}
        />
      </TabsContent>

      <TabsContent
        value="translations"
        keepMounted
        className="grid gap-6 data-[hidden]:hidden"
      >
        {settings ? (
          <>
            <MenuLanguageSettings {...settings} />

            {description ? (
              <RestaurantDescriptionEditor
                {...description}
                onPendingChange={setPending}
              />
            ) : (
              <Alert variant="destructive">
                <AlertDescription>
                  {t("descriptionUnavailable")}
                </AlertDescription>

                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => router.refresh()}
                >
                  {t("retry")}
                </Button>
              </Alert>
            )}

            <CatalogTranslationsEditor {...settings} catalog={catalog} />
          </>
        ) : (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{t("languagesUnavailable")}</AlertDescription>

            <Button
              variant="outline"
              className="mt-3"
              onClick={() => router.refresh()}
            >
              {t("retry")}
            </Button>
          </Alert>
        )}
      </TabsContent>
    </Tabs>
  )
}

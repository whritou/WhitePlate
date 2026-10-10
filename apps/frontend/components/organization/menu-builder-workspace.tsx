"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { EditorDialog } from "@/components/ui/editor-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { MenuBuilderProps, MenuBuilderView } from "@/types/menu-builder"
import { MenuBuilderCatalog } from "./menu-builder-catalog"
import { MenuBuilderCategories } from "./menu-builder-categories"
import { MenuLanguageSettings } from "./menu-language-settings"
import { CatalogTranslationsEditor } from "./catalog-translations-editor"
import { RestaurantDescriptionEditor } from "./restaurant-description-editor"
import { DiscountsEditor } from "./discounts-editor"
import { LiveAllergenReference } from "./live-allergen-reference"
import styles from "./menu-builder.module.css"

export function MenuBuilderWorkspace({
  userId,
  catalog,
  settings,
  description,
  initialView = "products",
}: MenuBuilderProps) {
  const t = useTranslations("MenuBuilder")
  const v = useTranslations("LiveParity")
  const router = useRouter()
  const [view, setView] = useState<MenuBuilderView>(
    initialView === "translations"
      ? "languages"
      : initialView === "categories"
        ? "products"
        : initialView
  )
  const [categoryId, setCategoryId] = useState(
    catalog.categories
      .filter((item) => !item.isArchived)
      .sort((a, b) => a.sortOrder - b.sortOrder)[0]?.id ?? "all"
  )
  const [pending, setPending] = useState(false)

  function changeView(value: unknown) {
    if (
      pending ||
      !["products", "allergens", "discounts", "languages"].includes(
        String(value)
      )
    )
      return
    setView(value as MenuBuilderView)

    const url = new URL(window.location.href)

    url.searchParams.set("view", String(value))
    window.history.replaceState(null, "", url.pathname + url.search + url.hash)
  }

  return (
    <Tabs
      className={`${styles.workspace} live-menu-builder @container`}
      value={view}
      onValueChange={changeView}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3">
        <h1 className="font-display text-xl font-bold">{v("title")}</h1>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {catalog.products.filter((item) => !item.isArchived).length}{" "}
            {v("dishes").toLowerCase()}
          </span>

          <p className="max-w-sm text-xs text-muted-foreground">
            {t("saveHelp")}
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6">
        <TabsList
          aria-label={t("sections")}
          className="h-auto max-w-full flex-wrap bg-background p-0"
        >
          {(
            [
              ["products", "dishes"],
              ["allergens", "allergens"],
              ["discounts", "discounts"],
              ["languages", "languages"],
            ] as const
          ).map(([value, label]) => (
            <TabsTrigger
              key={value}
              value={value}
              disabled={pending}
              className="label-mono px-4 py-3"
            >
              {v(label)}
            </TabsTrigger>
          ))}
        </TabsList>

        {(view === "products" || view === "allergens") && settings && (
          <div className="flex flex-wrap items-center gap-2 py-2">
            <span className="label-mono text-muted-foreground">
              {v("editingIn")}
            </span>

            <span className="label-mono border bg-accent px-3 py-2">
              {settings.defaultLocale.toUpperCase()} · {v("base")}
            </span>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => changeView("languages")}
              disabled={pending}
            >
              {v("languages")}
            </Button>
          </div>
        )}
      </div>

      <TabsContent value="products" keepMounted>
        <MenuBuilderCatalog
          userId={userId}
          catalog={catalog}
          settings={settings}
          pending={pending}
          onPendingChange={setPending}
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
        />
      </TabsContent>

      <TabsContent value="allergens" keepMounted>
        <LiveAllergenReference />
      </TabsContent>

      <TabsContent value="discounts" keepMounted>
        <div className="mx-auto max-w-3xl p-6">
          <DiscountsEditor
            tenantId={catalog.tenantId}
            currency={catalog.currency}
            discounts={catalog.discounts}
          />
        </div>
      </TabsContent>

      <TabsContent value="languages" keepMounted>
        <div className="mx-auto grid max-w-5xl gap-6 p-6">
          <h2 className="font-display text-2xl font-bold">{v("languages")}</h2>

          {settings ? (
            <>
              <MenuLanguageSettings {...settings} />

              {description && (
                <RestaurantDescriptionEditor
                  {...description}
                  onPendingChange={setPending}
                />
              )}

              <CatalogTranslationsEditor
                {...settings}
                catalog={catalog}
                onPendingChange={setPending}
              />
            </>
          ) : (
            <Alert variant="destructive">
              <AlertDescription>{t("languagesUnavailable")}</AlertDescription>

              <Button variant="outline" onClick={() => router.refresh()}>
                {t("retry")}
              </Button>
            </Alert>
          )}
        </div>
      </TabsContent>

      <div className="border-t px-6 py-3">
        <EditorDialog
          title={v("manageCategories")}
          label={v("manageCategories")}
          description={t("categoryHelp")}
          disabled={pending}
        >
          {() => (
            <MenuBuilderCategories
              catalog={catalog}
              selectedId={categoryId}
              onSelect={setCategoryId}
              pending={pending}
              onPendingChange={setPending}
            />
          )}
        </EditorDialog>
      </div>
    </Tabs>
  )
}

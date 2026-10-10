"use client"

import { useState } from "react"
import {
  Folder,
  Languages,
  Plus,
  TicketPercent,
  UtensilsCrossed,
  X,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { EditorDialog } from "@/components/ui/editor-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { MenuBuilderProps, MenuBuilderView } from "@/types/menu-builder"
import { MenuBuilderCatalog } from "./menu-builder-catalog"
import { MenuBuilderCategories } from "./menu-builder-categories"
import { CategoryForm } from "./category-form"
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
  const c = useTranslations("Catalog")
  const e = useTranslations("Editor")
  const router = useRouter()
  const [view, setView] = useState<MenuBuilderView>(
    initialView === "categories" ? "categories" : "products"
  )
  const [translationsOpen, setTranslationsOpen] = useState(
    initialView === "translations"
  )
  const [categoryId, setCategoryId] = useState("all")
  const [pending, setPending] = useState(false)

  function changeView(value: unknown) {
    if (pending || (value !== "products" && value !== "categories")) return

    setView(value)

    const url = new URL(window.location.href)

    url.searchParams.set("view", value)
    window.history.replaceState(null, "", url.pathname + url.search + url.hash)
  }

  return (
    <Tabs
      className={`${styles.workspace} live-menu-builder @container`}
      value={view}
      onValueChange={changeView}
    >
      <header className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b px-6 py-3">
        <div className="min-w-0">
          <p className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium tracking-wider uppercase">
            <span>{t("management")}</span>

            <span className="text-brand-text">{t("localizationStudio")}</span>
          </p>

          <h1 className="font-display text-xl font-bold">{t("title")}</h1>

          {restaurantName && (
            <p className="mt-3 text-sm text-muted-foreground">
              {restaurantName}
            </p>
          )}
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <TabsList
            aria-label={t("sections")}
            className="w-auto bg-background p-0"
          >
            <TabsTrigger
              value="products"
              disabled={pending}
              className="label-mono flex-wrap border-b-2 px-4 py-3 data-active:border-primary data-active:shadow-none"
            >
              <UtensilsCrossed aria-hidden="true" className="size-4 shrink-0" />

              {t("products")}
            </TabsTrigger>

            <TabsTrigger
              value="categories"
              disabled={pending}
              className="label-mono flex-wrap border-b-2 px-4 py-3 data-active:border-primary data-active:shadow-none"
            >
              <Folder aria-hidden="true" className="size-4 shrink-0" />

              {t("categories")}
            </TabsTrigger>
          </TabsList>

          <Dialog
            open={translationsOpen}
            disablePointerDismissal
            onOpenChange={(value) => {
              if (pending) return
              setTranslationsOpen(value)

              const url = new URL(window.location.href)

              url.searchParams.set("view", value ? "translations" : view)
              window.history.replaceState(
                null,
                "",
                url.pathname + url.search + url.hash
              )
            }}
          >
            <DialogTrigger
              disabled={pending}
              render={
                <Button variant="outline" className="justify-self-start" />
              }
            >
              <Languages aria-hidden="true" className="size-4" />

              {t("translations")}
            </DialogTrigger>

            <DialogContent keepMounted className="max-w-[64rem]">
              <header className="relative border-b border-border p-5 pr-16">
                <DialogTitle className="text-xl font-semibold">
                  {t("translations")}
                </DialogTitle>

                <DialogDescription className="mt-2 text-sm text-muted-foreground">
                  {t("saveHelp")}
                </DialogDescription>

                <DialogClose
                  disabled={pending}
                  aria-label={e("close")}
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-3 right-3"
                    />
                  }
                >
                  <X aria-hidden="true" />
                </DialogClose>
              </header>

              <div className="grid min-h-0 min-w-0 gap-6 overflow-y-auto p-5">
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

                    <CatalogTranslationsEditor
                      {...settings}
                      catalog={catalog}
                      onPendingChange={setPending}
                    />
                  </>
                ) : (
                  <Alert variant="destructive" role="alert">
                    <AlertDescription>
                      {t("languagesUnavailable")}
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
              </div>
            </DialogContent>
          </Dialog>

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
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
        />
      </TabsContent>

      <TabsContent
        value="categories"
        keepMounted
        className="grid gap-6 data-[hidden]:hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">{t("categoryHelp")}</p>

          <EditorDialog
            primary
            icon={Plus}
            title={c("newCategory")}
            label={c("newCategory")}
            description={t("categoryHelp")}
            disabled={pending}
          >
            {(callbacks) => (
              <CategoryForm
                tenantId={catalog.tenantId}
                {...callbacks}
                onPendingChange={(value) => {
                  callbacks.onPendingChange?.(value)
                  setPending(value)
                }}
              />
            )}
          </EditorDialog>
        </div>

        <MenuBuilderCategories
          catalog={catalog}
          selectedId={categoryId}
          onSelect={(id) => {
            setCategoryId(id)
            changeView("products")
          }}
          pending={pending}
          onPendingChange={setPending}
        />
      </TabsContent>
    </Tabs>
  )
}

"use client"

import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import { Fragment, useState } from "react"
import { ChefHat, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { CustomerShell } from "./customer-shell"
import { RestaurantIdentity } from "./restaurant-identity"
import { ThemeCustomizer } from "./theme-customizer"
import { useDemo } from "./demo-provider"
import { DemoMenuCart } from "./demo-menu-cart"

export function DemoMenu() {
  const t = useTranslations("Redesign")
  const locale = useLocale()
  const demo = useDemo()
  const [theme, setTheme] = useState("orange")
  const [category, setCategory] = useState("popular")
  const [search, setSearch] = useState("")
  const price = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
  })
  const products = demo.products.filter(
    (product) =>
      (category === "popular" || product.category === category) &&
      `${product.name} ${product.description}`
        .toLocaleLowerCase(locale)
        .includes(search.toLocaleLowerCase(locale))
  )

  return (
    <div className="pb-28 xl:pb-0">
      <CustomerShell>
        <main
          className={`tenant-demo theme-${theme} pb-8 [overflow-wrap:anywhere]`}
        >
          <ThemeCustomizer theme={theme} onChange={setTheme} />

          <RestaurantIdentity
            name="Artisan Burger Co."
            description={t("restaurantDescription")}
            illustrative
          />

          <div className="z-20 mt-5 bg-background/95 py-3 backdrop-blur-xl lg:sticky lg:top-20">
            <div className="mx-auto grid max-w-7xl min-w-0 gap-3 px-4 sm:px-6 lg:px-8">
              <nav
                aria-label={t("categories")}
                className="flex min-w-0 gap-2 overflow-x-auto overscroll-x-contain p-1"
              >
                {["popular", "burgers", "chicken", "sides", "drinks"].map(
                  (item) => (
                    <Button
                      key={item}
                      size="sm"
                      variant={category === item ? "default" : "secondary"}
                      className="max-w-[min(100%,18rem)] shrink-0 rounded-full py-1.5 text-center text-sm whitespace-normal"
                      aria-pressed={category === item}
                      onClick={() => setCategory(item)}
                    >
                      {t(item === "chicken" ? "chickenCategory" : item)}
                    </Button>
                  )
                )}
              </nav>

              <div className="relative w-full lg:max-w-[24rem]">
                <Search
                  aria-hidden="true"
                  className="absolute top-3.5 left-3 size-4 text-muted-foreground"
                />

                <Input
                  aria-label={t("searchMenu")}
                  placeholder={t("searchMenu")}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="border-0 bg-secondary pl-9 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="mx-auto mt-6 grid max-w-7xl min-w-0 items-start gap-6 px-4 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-8">
            <section className="min-w-0">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 basis-48">
                  <h2 className="font-heading text-headline-md">
                    {t(category === "chicken" ? "chickenCategory" : category)}
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("popularDescription")}
                  </p>
                </div>

                <Badge variant="neutral">
                  {t("featured", {
                    count:
                      category === "popular" && !search ? 4 : products.length,
                  })}
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {products.map((product, index) => (
                  <Fragment key={product.id}>
                    {category === "popular" && !search && index === 4 && (
                      <div className="col-span-full mt-6 mb-1">
                        <h2 className="font-heading text-headline-md">
                          {t("drinks")}
                        </h2>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {t("shakesDescription")}
                        </p>
                      </div>
                    )}

                    <Card
                      key={product.id}
                      className="gap-4 border-0 p-4 shadow-xs has-data-[slot=card-footer]:pb-4"
                    >
                      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 p-0">
                        <div className="min-w-0 flex-1 basis-36">
                          <Badge
                            variant={
                              product.id === "chicken" ? "warning" : "neutral"
                            }
                            className="mb-2 text-xs"
                          >
                            {product.badge}
                          </Badge>

                          <CardTitle>
                            <h3 className="text-base">{product.name}</h3>
                          </CardTitle>

                          <p className="mt-2 text-sm leading-5 text-muted-foreground">
                            {product.description}
                          </p>
                        </div>

                        <Image
                          src={product.image}
                          alt=""
                          width={112}
                          height={112}
                          className="size-20 shrink-0 rounded-md object-cover sm:size-24"
                        />
                      </CardHeader>

                      <CardFooter className="mt-auto flex-wrap justify-between gap-3 border-0 p-0">
                        <span className="font-heading font-bold tabular-nums">
                          {price.format(product.basePrice)}
                        </span>

                        <Button
                          size="sm"
                          aria-label={t("addProduct", { name: product.name })}
                          onClick={() =>
                            demo.changeQuantity(
                              product.id,
                              (demo.cart.find(
                                (item) => item.productId === product.id
                              )?.quantity ?? 0) + 1
                            )
                          }
                        >
                          <Plus aria-hidden="true" />

                          {t("add")}
                        </Button>
                      </CardFooter>
                    </Card>
                  </Fragment>
                ))}

                {products.length === 0 && (
                  <p
                    role="status"
                    className="col-span-full py-10 text-muted-foreground"
                  >
                    {t("noProducts")}
                  </p>
                )}
              </div>

              <Card className="mt-8 flex-col items-start gap-4 border-0 bg-muted p-4 sm:flex-row sm:p-6">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <ChefHat aria-hidden="true" />
                </span>

                <div>
                  <h3 className="font-heading font-semibold">
                    {t("supportDirect")}
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {t("supportDirectDescription")}
                  </p>
                </div>
              </Card>
            </section>

            <DemoMenuCart />
          </div>
        </main>
      </CustomerShell>
    </div>
  )
}

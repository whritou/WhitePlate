"use client"

import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import { Fragment, useState } from "react"
import {
  ArrowRight,
  ChefHat,
  MapPin,
  Plus,
  Search,
  ShoppingCart,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Link } from "@/i18n/navigation"
import { calculateDemoOrder } from "@/lib/checkout/demo-order"
import { CustomerShell } from "./customer-shell"
import { RestaurantIdentity } from "./restaurant-identity"
import { ThemeCustomizer } from "./theme-customizer"
import { useDemo } from "./demo-provider"

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
  const totals = calculateDemoOrder(demo.products, demo.cart, "")
  const count = demo.cart.reduce((total, item) => total + item.quantity, 0)

  return (
    <CustomerShell>
      <main className={`tenant-demo theme-${theme} pb-8`}>
        <ThemeCustomizer theme={theme} onChange={setTheme} />

        <RestaurantIdentity
          name="Artisan Burger Co."
          description={t("restaurantDescription")}
          illustrative
        />

        <div className="sticky top-20 z-20 mt-5 bg-background/95 py-3 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 sm:px-8">
            <nav
              aria-label={t("categories")}
              className="flex min-w-0 flex-1 gap-2 overflow-x-auto"
            >
              {["popular", "burgers", "chicken", "sides", "drinks"].map(
                (item) => (
                  <Button
                    key={item}
                    size="sm"
                    variant={category === item ? "default" : "secondary"}
                    className="shrink-0 rounded-full text-xs"
                    aria-pressed={category === item}
                    onClick={() => setCategory(item)}
                  >
                    {t(item === "chicken" ? "chickenCategory" : item)}
                  </Button>
                )
              )}
            </nav>

            <div className="relative w-full sm:w-64">
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

        <div className="mx-auto mt-8 grid max-w-7xl items-start gap-8 px-4 sm:px-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
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
                    className="gap-3 border-0 p-4 shadow-xs"
                  >
                    <CardHeader className="flex flex-row items-start justify-between gap-3 p-0">
                      <div className="min-w-0">
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

                        <p className="mt-2 line-clamp-3 text-sm leading-5 text-muted-foreground">
                          {product.description}
                        </p>
                      </div>

                      <Image
                        src={product.image}
                        alt=""
                        width={112}
                        height={112}
                        className="size-24 shrink-0 rounded-md object-cover"
                      />
                    </CardHeader>

                    <CardFooter className="justify-between border-0 p-0">
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
                <p role="status" className="py-10 text-muted-foreground">
                  {t("noProducts")}
                </p>
              )}
            </div>

            <Card className="mt-8 flex-row items-start gap-4 border-0 bg-muted p-6">
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

          <aside id="demo-cart" className="scroll-mt-24 lg:sticky lg:top-44">
            <Card className="gap-5 border-0 p-5 shadow-lg">
              <CardHeader className="flex items-center justify-between p-0">
                <CardTitle>
                  <h2 className="flex items-center gap-2 text-base">
                    <ShoppingCart
                      aria-hidden="true"
                      className="size-5 text-primary"
                    />

                    {t("yourOrder")}
                  </h2>
                </CardTitle>

                <Badge variant="neutral">{t("items", { count })}</Badge>
              </CardHeader>

              <CardContent className="p-0">
                <Badge
                  variant="neutral"
                  className="mb-5 w-full justify-between"
                >
                  {t("selfPickup")}

                  <span>{t("prepValue")}</span>
                </Badge>

                <ul className="grid gap-5">
                  {demo.cart.map((item) => {
                    const product = demo.products.find(
                      (candidate) => candidate.id === item.productId
                    )!

                    return (
                      <li key={item.productId}>
                        <div className="flex items-start justify-between gap-3 text-sm">
                          <p>
                            <span className="mr-2 font-semibold text-primary">
                              {item.quantity}×
                            </span>

                            <strong>{product.name}</strong>
                          </p>

                          <span className="shrink-0 tabular-nums">
                            {price.format(product.basePrice * item.quantity)}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            aria-label={t("decrease", { name: product.name })}
                            onClick={() =>
                              demo.changeQuantity(
                                item.productId,
                                item.quantity - 1
                              )
                            }
                          >
                            −
                          </Button>

                          <span className="text-sm tabular-nums">
                            {item.quantity}
                          </span>

                          <Button
                            size="sm"
                            variant="secondary"
                            aria-label={t("increase", { name: product.name })}
                            onClick={() =>
                              demo.changeQuantity(
                                item.productId,
                                item.quantity + 1
                              )
                            }
                          >
                            +
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label={t("removeProduct", {
                              name: product.name,
                            })}
                            onClick={() =>
                              demo.changeQuantity(item.productId, 0)
                            }
                          >
                            <X aria-hidden="true" />

                            {t("remove")}
                          </Button>
                        </div>
                      </li>
                    )
                  })}
                </ul>

                {count === 0 && (
                  <p role="status" className="text-sm text-muted-foreground">
                    {t("emptyCart")}
                  </p>
                )}

                <div className="mt-6 grid gap-2 text-sm">
                  <p className="flex justify-between text-muted-foreground">
                    <span>{t("subtotal")}</span>

                    <span>{price.format(totals.subtotal)}</span>
                  </p>

                  <p className="flex justify-between text-muted-foreground">
                    <span>{t("estimatedTax")}</span>

                    <span>{price.format(totals.tax)}</span>
                  </p>

                  <p className="flex justify-between border-t border-border pt-4 font-bold">
                    <span>{t("total")}</span>

                    <span>{price.format(totals.total)}</span>
                  </p>
                </div>
              </CardContent>

              <CardFooter className="grid gap-2 border-0 p-0">
                <Button
                  disabled={count === 0}
                  nativeButton={false}
                  render={<Link href="/demo/checkout" />}
                  className="w-full justify-between"
                >
                  {t("checkoutOrder")}

                  <span className="flex items-center gap-2">
                    {price.format(totals.total)}

                    <ArrowRight aria-hidden="true" />
                  </span>
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  {t("securePaymentPreview")}
                </p>
              </CardFooter>
            </Card>

            <p className="mt-4 flex items-center gap-2 rounded-md bg-muted p-4 text-xs text-muted-foreground">
              <MapPin aria-hidden="true" className="size-5 text-primary" />

              {t("address")}
            </p>
          </aside>
        </div>
      </main>
    </CustomerShell>
  )
}

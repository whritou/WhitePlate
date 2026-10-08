"use client"

import { ArrowRight, MapPin, ShoppingCart, X } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { calculateDemoOrder } from "@/lib/checkout/demo-order"
import { useDemo } from "./demo-provider"

export function DemoMenuCart() {
  const t = useTranslations("Redesign")
  const locale = useLocale()
  const demo = useDemo()
  const price = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
  })
  const totals = calculateDemoOrder(demo.products, demo.cart, "")
  const count = demo.cart.reduce((total, item) => total + item.quantity, 0)

  return (
    <>
      <aside
        id="demo-cart"
        className="scroll-mt-24 focus-visible:outline-ring lg:scroll-mt-56 xl:sticky xl:top-56"
        tabIndex={-1}
      >
        <Card className="gap-5 border-0 p-4 shadow-lg has-data-[slot=card-footer]:pb-4 sm:p-5 sm:has-data-[slot=card-footer]:pb-5">
          <CardHeader className="flex flex-wrap items-center justify-between gap-3 p-0">
            <CardTitle>
              <h2 className="flex items-center gap-2 text-base">
                <ShoppingCart
                  aria-hidden="true"
                  className="size-5 text-primary"
                />

                {t("yourOrder")}
              </h2>
            </CardTitle>

            <Badge
              variant="neutral"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {t("items", { count })}
            </Badge>
          </CardHeader>

          <CardContent className="p-0">
            <Badge
              variant="neutral"
              className="mb-5 w-full flex-wrap justify-between gap-2 text-left"
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
                    <div className="flex flex-wrap items-start justify-between gap-2 text-sm">
                      <p className="min-w-0 flex-1 basis-36">
                        <span className="mr-2 font-semibold text-primary">
                          {item.quantity}×
                        </span>

                        <strong>{product.name}</strong>
                      </p>

                      <span className="shrink-0 tabular-nums">
                        {price.format(product.basePrice * item.quantity)}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        aria-label={t("decrease", { name: product.name })}
                        onClick={() =>
                          demo.changeQuantity(item.productId, item.quantity - 1)
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
                          demo.changeQuantity(item.productId, item.quantity + 1)
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
                        onClick={() => demo.changeQuantity(item.productId, 0)}
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
              <p className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-muted-foreground">
                <span>{t("subtotal")}</span>

                <span>{price.format(totals.subtotal)}</span>
              </p>

              <p className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-muted-foreground">
                <span>{t("estimatedTax")}</span>

                <span>{price.format(totals.tax)}</span>
              </p>

              <p className="flex flex-wrap justify-between gap-3 border-t border-border pt-4 font-bold">
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
              className="w-full flex-wrap justify-between gap-3"
            >
              {t("checkoutOrder")}

              <span className="flex items-center gap-2">
                <span className="whitespace-nowrap">
                  {price.format(totals.total)}
                </span>

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

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-xl xl:hidden">
        <Button
          nativeButton={false}
          role="link"
          render={<a href="#demo-cart" />}
          className="mx-auto flex w-full max-w-7xl flex-wrap justify-between gap-x-3 gap-y-1 text-sm"
          onClick={() =>
            document.getElementById("demo-cart")?.focus({ preventScroll: true })
          }
        >
          <span className="flex min-w-0 items-center gap-2">
            <ShoppingCart aria-hidden="true" />

            <span>
              {t("yourOrder")} · {t("items", { count })}
            </span>
          </span>

          <span className="ml-auto font-semibold whitespace-nowrap tabular-nums">
            {price.format(totals.total)}
          </span>
        </Button>
      </div>
    </>
  )
}

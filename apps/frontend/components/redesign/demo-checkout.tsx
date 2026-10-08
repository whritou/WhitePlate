"use client"

import Image from "next/image"
import { ArrowLeft, LockKeyhole, MapPin, Tag } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link, useRouter } from "@/i18n/navigation"
import { calculateDemoOrder } from "@/lib/checkout/demo-order"
import { CustomerShell } from "./customer-shell"
import { PickupDetails } from "./pickup-details"
import { useDemo } from "./demo-provider"

export function DemoCheckout() {
  const t = useTranslations("Redesign")
  const locale = useLocale()
  const demo = useDemo()
  const router = useRouter()
  const [code, setCode] = useState(demo.discountCode)
  const [applied, setApplied] = useState(false)
  const totals = calculateDemoOrder(demo.products, demo.cart, demo.discountCode)
  const price = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
  })
  const count = demo.cart.reduce((total, item) => total + item.quantity, 0)

  return (
    <CustomerShell>
      <main>
        <div className="bg-muted">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-8">
            <Link
              href="/demo"
              className="inline-flex min-h-11 items-center gap-2 text-sm"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />

              {t("backToMenu")}
            </Link>

            <Badge variant="success">{t("readyWindow")}</Badge>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <Badge variant="warning">{t("fastLane")}</Badge>

              <p className="ml-3 inline text-xs text-muted-foreground">
                {t("checkoutStep")}
              </p>

              <h1 className="mt-3 font-heading text-headline-lg">
                {t("reviewPickup")}
              </h1>
            </div>

            <p className="rounded-md bg-card p-3 text-sm font-semibold">
              Artisan Burger Co.
              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                ★ 4.9 {t("reviews")}
              </span>
            </p>
          </header>

          {count === 0 ? (
            <Card className="p-8">
              <p>{t("emptyCart")}</p>

              <Link href="/demo" className="text-primary underline">
                {t("backToMenu")}
              </Link>
            </Card>
          ) : (
            <form
              id="demo-checkout"
              onSubmit={(event) => {
                event.preventDefault()
                if (demo.placeOrder()) router.push("/demo/tracking")
              }}
              className="grid min-w-0 grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]"
            >
              <PickupDetails
                name={demo.customerName}
                onNameChange={demo.setCustomerName}
              />

              <aside className="lg:sticky lg:top-24">
                <Card className="gap-0 overflow-hidden border-0 p-0 shadow-md">
                  <div className="relative h-32">
                    <Image
                      src="/design/photo-10.webp"
                      alt=""
                      fill
                      sizes="500px"
                      className="object-cover"
                    />

                    <p className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-obsidian/70 p-3 text-sm font-semibold text-white">
                      <MapPin aria-hidden="true" className="size-4" />

                      {t("curbsideBay")}
                    </p>
                  </div>

                  <CardHeader className="flex items-center justify-between p-6">
                    <CardTitle>
                      <h2>{t("orderSummary")}</h2>
                    </CardTitle>

                    <Badge variant="neutral">{t("items", { count })}</Badge>
                  </CardHeader>

                  <CardContent className="grid gap-5 px-6 pb-6">
                    <ul className="grid gap-5">
                      {demo.cart.map((item) => {
                        const product = demo.products.find(
                          (candidate) => candidate.id === item.productId
                        )!

                        return (
                          <li
                            key={item.productId}
                            className="flex items-start gap-3"
                          >
                            <Image
                              src={product.image}
                              alt=""
                              width={60}
                              height={60}
                              className="size-15 rounded-md object-cover"
                            />

                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">
                                {product.name}
                              </p>

                              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                                {product.description}
                              </p>

                              <p className="mt-1 text-xs">
                                {t("quantity", { count: item.quantity })}
                              </p>
                            </div>

                            <span className="shrink-0 text-sm tabular-nums">
                              {price.format(item.quantity * product.basePrice)}
                            </span>
                          </li>
                        )
                      })}
                    </ul>

                    <div className="flex items-end gap-2">
                      <Label
                        htmlFor="demo-discount"
                        className="grid flex-1 gap-2"
                      >
                        <span className="sr-only">{t("discountCode")}</span>

                        <Input
                          id="demo-discount"
                          value={code}
                          onChange={(event) => setCode(event.target.value)}
                          className="border-transparent bg-muted"
                        />
                      </Label>

                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          demo.setDiscountCode(code)
                          setApplied(true)
                        }}
                      >
                        {t("apply")}
                      </Button>
                    </div>

                    {(totals.discount > 0 || applied) && (
                      <p
                        role="status"
                        className={`flex items-center gap-2 text-xs ${totals.discount > 0 ? "text-success" : "text-destructive"}`}
                      >
                        <Tag aria-hidden="true" className="size-4" />

                        {totals.discount > 0
                          ? t("discountApplied")
                          : t("invalidDiscount")}
                      </p>
                    )}

                    <div className="grid gap-3 rounded-lg bg-muted p-4 text-sm">
                      <SummaryRow
                        label={t("subtotal")}
                        value={price.format(totals.subtotal)}
                      />

                      <SummaryRow
                        label={t("directDiscount")}
                        value={`−${price.format(totals.discount)}`}
                        success
                      />

                      <SummaryRow
                        label={t("estimatedTax")}
                        value={price.format(totals.tax)}
                      />

                      <SummaryRow
                        label={t("commission")}
                        value={price.format(0)}
                        success
                      />

                      <div className="mt-2 flex items-end justify-between gap-3 border-t border-border pt-4">
                        <span className="font-heading text-lg font-semibold">
                          {t("totalDue")}

                          <span className="mt-1 block text-xs font-normal text-muted-foreground">
                            {t("taxIncluded")}
                          </span>
                        </span>

                        <strong className="font-heading text-headline-lg tabular-nums">
                          {price.format(totals.total)}
                        </strong>
                      </div>
                    </div>

                    <Button type="submit" size="lg" className="w-full">
                      <LockKeyhole aria-hidden="true" />

                      <span>
                        {`${t("placePickup")} · ${price.format(totals.total)}`}
                      </span>
                    </Button>

                    <p className="text-center text-xs text-muted-foreground">
                      {t("demoOrderNotice")}
                    </p>
                  </CardContent>

                  <div className="bg-secondary p-5 text-sm">
                    <strong>{t("supportLocal")}</strong>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("supportLocalDescription")}
                    </p>
                  </div>
                </Card>
              </aside>
            </form>
          )}
        </div>
      </main>
    </CustomerShell>
  )
}

function SummaryRow({
  label,
  value,
  success,
}: {
  label: string
  value: string
  success?: boolean
}) {
  return (
    <p
      className={`flex justify-between gap-3 ${success ? "text-success" : "text-muted-foreground"}`}
    >
      <span>{label}</span>

      <span className="shrink-0 tabular-nums">{value}</span>
    </p>
  )
}

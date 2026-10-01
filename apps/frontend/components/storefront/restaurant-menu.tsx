"use client"

import { useRef, useState, useTransition, type FormEvent } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import type { StorefrontMenu } from "@/lib/api/public-storefront"
import type { ApiError } from "@/lib/api/request-factory"
import { checkoutGuestOrder } from "@/lib/checkout-actions"
import {
  prepareCheckout,
  updateCart,
  validProductSelection,
  validateOrderInput,
  type CartItem,
  type CheckoutAttempt,
} from "@/lib/checkout/cart"
import type { OrderReceipt } from "@/lib/checkout/order-client"
import { Receipt } from "./receipt"
import { ProductOrdering } from "./product-ordering"
import { cn } from "@/lib/utils"

const inputClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"

export function RestaurantMenu({ menu }: { menu: StorefrontMenu }) {
  const t = useTranslations("Storefront")
  const c = useTranslations("Checkout")
  const locale = useLocale()
  const router = useRouter()
  const [changingLanguage, startLanguageChange] = useTransition()
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState("")
  const [discountCode, setDiscountCode] = useState("")
  const [error, setError] = useState<ApiError | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null)
  const [orderRound, setOrderRound] = useState(0)
  const attempt = useRef<CheckoutAttempt | null>(null)
  const inFlight = useRef(false)
  const uncertain = error === "unavailable"
  const locked = submitting || uncertain || changingLanguage || receipt !== null
  const products = menu.categories.flatMap((category) => category.products)
  const price = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: menu.currency,
  })
  const names = new Intl.DisplayNames([locale], { type: "language" })
  const quantity = cart.reduce((sum, item) => sum + item.quantity, 0)

  function changeCart(item: CartItem) {
    setCart((current) => updateCart(current, item))
    setError(null)
  }

  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current) return
    const input = {
      customerName,
      discountCode: discountCode || null,
      items: cart,
    }
    if (
      !uncertain &&
      (!validateOrderInput(input) ||
        cart.some((item) => {
          const product = products.find(
            (candidate) => candidate.id === item.productId
          )
          return !product || !validProductSelection(product, item.optionIds)
        }))
    ) {
      setError("invalid")
      return
    }
    const next =
      uncertain && attempt.current
        ? attempt.current
        : prepareCheckout(input, attempt.current, () => crypto.randomUUID())
    attempt.current = next
    inFlight.current = true
    setSubmitting(true)
    setError(null)
    try {
      const result = await checkoutGuestOrder(next.input, next.key)
      if (result.ok && result.receipt.tenantId === menu.tenantId) {
        setReceipt(result.receipt)
        setCart([])
      } else {
        setError(result.ok ? "unavailable" : result.error)
      }
    } catch {
      setError("unavailable")
    } finally {
      inFlight.current = false
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto min-h-svh max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-6">
        <div>
          <p className="text-sm font-medium text-primary">WhitePlate</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {menu.restaurantName}
          </h1>
        </div>
        <div className="grid gap-1.5">
          <label
            htmlFor="menu-language"
            className="text-xs font-medium text-muted-foreground"
          >
            {t("menuLanguage")}
          </label>
          <select
            id="menu-language"
            value={menu.locale}
            disabled={locked}
            className={inputClass}
            onChange={(event) =>
              startLanguageChange(() =>
                router.replace(
                  { pathname: "/", query: { menuLocale: event.target.value } },
                  { scroll: false }
                )
              )
            }
          >
            {menu.availableLocales.map((language) => (
              <option key={language} value={language} lang={language}>
                {languageName(names, language)} ({language})
              </option>
            ))}
          </select>
        </div>
      </header>
      <p className="mt-5 text-sm text-muted-foreground">
        {t("menuDescription")}
      </p>
      <div className="mt-9 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid gap-10" lang={menu.locale}>
          {menu.categories.length === 0 && (
            <p className="rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground">
              {t("emptyMenu")}
            </p>
          )}
          {menu.categories.map((category) => (
            <section
              key={category.id}
              aria-labelledby={`category-${category.id}`}
            >
              <h2
                id={`category-${category.id}`}
                className="border-b border-border pb-3 text-xl font-semibold tracking-tight"
              >
                {category.name}
              </h2>
              {category.products.length === 0 && (
                <p className="pt-4 text-sm text-muted-foreground">
                  {t("emptyCategory")}
                </p>
              )}
              <ul className="divide-y divide-border">
                {category.products.map((product) => (
                  <li key={product.id} className="py-5">
                    <div className="flex items-start justify-between gap-5">
                      <div className="min-w-0">
                        <h3 className="font-medium">{product.name}</h3>
                        {product.description && (
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {product.description}
                          </p>
                        )}
                        {!product.isAvailable && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {t("unavailableProduct")}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-sm font-medium tabular-nums">
                        {price.format(product.basePrice)}
                      </span>
                    </div>
                    {product.isAvailable && (
                      <ProductOrdering
                        key={`${product.id}-${orderRound}`}
                        product={product}
                        item={cart.find(
                          (item) => item.productId === product.id
                        )}
                        locked={locked}
                        price={price}
                        onSave={changeCart}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <aside
          aria-labelledby="cart-heading"
          className="rounded-lg border border-border bg-card p-5 lg:sticky lg:top-6"
        >
          {receipt ? (
            <>
              <Receipt receipt={receipt} />
              <Button
                type="button"
                variant="outline"
                className="mt-5 w-full"
                onClick={() => {
                  setReceipt(null)
                  attempt.current = null
                  setError(null)
                  setCustomerName("")
                  setDiscountCode("")
                  setOrderRound((round) => round + 1)
                }}
              >
                {c("newOrder")}
              </Button>
            </>
          ) : (
            <>
              <h2 id="cart-heading" className="text-xl font-semibold">
                {c("cartTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {c("cartCount", { count: quantity })}
              </p>
              {cart.length === 0 ? (
                <p className="my-6 text-sm text-muted-foreground">
                  {c("emptyCart")}
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-border">
                  {cart.map((item) => {
                    const product = products.find(
                      (product) => product.id === item.productId
                    )
                    const options =
                      product?.optionGroups
                        .flatMap((group) => group.options)
                        .filter((option) =>
                          item.optionIds.includes(option.id)
                        ) ?? []
                    return (
                      <li key={item.productId} className="py-4">
                        <p className="font-medium">
                          {product?.name ?? t("unavailableProduct")}
                        </p>
                        {options.length > 0 && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {options.map((option) => option.name).join(", ")}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <label className="flex items-center gap-2 text-sm">
                            {c("quantity")}
                            <input
                              type="number"
                              min={1}
                              max={99}
                              step={1}
                              value={item.quantity}
                              disabled={locked}
                              aria-label={c("quantityFor", {
                                product:
                                  product?.name ?? t("unavailableProduct"),
                              })}
                              className={cn(inputClass, "w-16")}
                              onChange={(event) => {
                                const value = Number(event.target.value)
                                if (
                                  Number.isInteger(value) &&
                                  value >= 1 &&
                                  value <= 99
                                )
                                  changeCart({ ...item, quantity: value })
                              }}
                            />
                          </label>
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={locked}
                            aria-label={c("removeProduct", {
                              product: product?.name ?? t("unavailableProduct"),
                            })}
                            onClick={() => changeCart({ ...item, quantity: 0 })}
                          >
                            {c("remove")}
                          </Button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                {c("priceNote")}
              </p>
              <form
                onSubmit={checkout}
                className="mt-5 grid gap-4"
                aria-busy={submitting}
              >
                <fieldset
                  disabled={locked || cart.length === 0}
                  className="grid gap-4"
                >
                  <label
                    className="grid gap-1.5 text-sm font-medium"
                    htmlFor="customer-name"
                  >
                    {c("customerName")}
                    <input
                      id="customer-name"
                      name="customerName"
                      autoComplete="name"
                      maxLength={200}
                      required
                      className={inputClass}
                      value={customerName}
                      onChange={(event) => {
                        setCustomerName(event.target.value)
                        setError(null)
                      }}
                    />
                  </label>
                  <label
                    className="grid gap-1.5 text-sm font-medium"
                    htmlFor="discount-code"
                  >
                    {c("discountCode")}
                    <input
                      id="discount-code"
                      name="discountCode"
                      maxLength={64}
                      className={inputClass}
                      value={discountCode}
                      onChange={(event) => {
                        setDiscountCode(event.target.value)
                        setError(null)
                      }}
                    />
                  </label>
                </fieldset>
                {error && (
                  <p
                    role="alert"
                    className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                  >
                    {c(`errors.${error}`)}
                  </p>
                )}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={submitting || changingLanguage || cart.length === 0}
                >
                  {submitting
                    ? c("placingOrder")
                    : uncertain
                      ? c("retryOrder")
                      : c("placeOrder")}
                </Button>
                {submitting && (
                  <p role="status" className="text-sm text-muted-foreground">
                    {c("placingOrder")}
                  </p>
                )}
              </form>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                {c("visitOnly")}
              </p>
            </>
          )}
        </aside>
      </div>
    </main>
  )
}

function languageName(names: Intl.DisplayNames, locale: string) {
  try {
    return names.of(locale) ?? locale
  } catch {
    return locale
  }
}

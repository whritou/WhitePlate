"use client"
import { Copy } from "@/components/shared/translated-copy"
import { Link } from "@/components/demo/shared/navigation"
import {
  Check,
  ChefHat,
  Clock3,
  MapPin,
  PackageCheck,
  ShoppingBag,
} from "lucide-react"
import { Button } from "@/components/ui/lovable-button"
import { CustomerPickupLocation } from "../../customer-pickup-location"
import { CustomerShell } from "@/components/storefront/demo/shared/customer-shell"
import { OrderItems } from "@/components/storefront/demo/checkout/checkout"
import type { CustomerOrder } from "@/lib/lovable/customerOrder"
import type { StoreTheme } from "@/lib/lovable/storeTheme"
import type { CustomerTrackingBinding } from "@/types/customer-presentation"
import { useTranslations } from "next-intl"
export function CustomerTracking({
  t,
  order,
  preview = false,
  binding,
}: {
  t: StoreTheme
  order: CustomerOrder | null
  preview?: boolean
  binding?: CustomerTrackingBinding
}) {
  const checkout = useTranslations("Checkout")

  if (!order)
    return (
      <CustomerShell t={t} preview={preview}>
        <div className="py-16 text-center">
          <ShoppingBag className="mx-auto mb-5 h-10 w-10 text-primary" />

          <h1 className="text-3xl font-bold">
            <Copy>Order not found</Copy>
          </h1>

          <p className="mt-3 text-muted-foreground">
            <Copy>
              Demo orders are only available in the browser tab where they were
              placed.
            </Copy>
          </p>

          <Button asChild className="mt-6">
            <Link to="/store">
              <Copy>Back to menu</Copy>
            </Link>
          </Button>
        </div>
      </CustomerShell>
    )

  const stage = binding?.stage ?? (preview ? 1 : 0)
  const taxAmount =
    binding?.taxAmount ??
    Math.max(
      0,
      Math.round((order.total - order.subtotal + order.discount) * 100) / 100
    )
  const money = binding?.money ?? ((value: number) => `€${value.toFixed(2)}`)
  const steps = [
    {
      label: "Order received",
      sub: preview || binding ? "Confirmed" : "Saved in this browser",
      icon: Check,
    },
    {
      label: "In the kitchen",
      sub: "Your dishes are being prepared",
      icon: ChefHat,
    },
    {
      label: "Ready for pickup",
      sub: "Come to the collection counter",
      icon: PackageCheck,
    },
    { label: "Collected", sub: "Enjoy your meal", icon: ShoppingBag },
  ]
  const scheduled =
    order.pickup === "As soon as possible"
      ? `Around ${t.prepTime}`
      : new Date(order.pickup).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })

  const content = (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-primary">
          <Copy>Order #</Copy>

          <Copy>{order.id}</Copy>
        </p>

        <span
          role="status"
          className="customer-rounded border px-3 py-1 text-xs font-semibold"
        >
          <Copy>
            {binding?.statusLabel ??
              (preview ? "Preview order" : "Demo order · Not live")}
          </Copy>
        </span>
      </div>

      <div className="customer-two-column grid min-w-0 items-start gap-10">
        <div>
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Copy>
              {stage === 1 ? <ChefHat size={30} /> : <Check size={30} />}
            </Copy>
          </div>

          <h1 className="text-3xl font-bold">
            <Copy>
              {binding?.heading ??
                (preview
                  ? "Good food is on its way."
                  : `Thanks, ${order.name.split(" ")[0] || "there"}!`)}
            </Copy>
          </h1>

          <p className="mt-3 text-muted-foreground">
            <Copy>
              {binding?.description ??
                (preview
                  ? "The kitchen is working on your order."
                  : "Your demo order is saved. No payment was taken and the restaurant has not received it.")}
            </Copy>
          </p>

          <div className="mt-6 flex items-center gap-3 border-y py-5">
            <Clock3 size={22} className="text-primary" />

            <div>
              <p className="text-xs text-muted-foreground">
                <Copy>
                  {order.pickup === "As soon as possible"
                    ? "Estimated pickup"
                    : "Requested pickup"}
                </Copy>
              </p>

              <p className="mt-1 text-xl font-bold">
                <Copy>{binding?.pickup ?? scheduled}</Copy>
              </p>
            </div>
          </div>

          <ol className="my-8">
            <Copy>
              {steps.map((step, i) => (
                <li
                  key={step.label}
                  aria-current={i === stage ? "step" : undefined}
                  className="relative flex min-h-20 gap-4 pb-6 last:min-h-0 last:pb-0"
                >
                  <Copy>
                    {i < steps.length - 1 && (
                      <span
                        className={`absolute top-9 bottom-0 left-[17px] w-px ${i < stage ? "bg-primary" : "bg-border"}`}
                      />
                    )}
                  </Copy>

                  <div
                    className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${i <= stage ? "bg-primary text-primary-foreground" : "border bg-background text-muted-foreground"}`}
                  >
                    <step.icon size={17} />
                  </div>

                  <div className="pt-1">
                    <p
                      className={`text-sm font-bold ${i > stage ? "text-muted-foreground" : ""}`}
                    >
                      <Copy>{step.label}</Copy>
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      <Copy>
                        {i > stage && !preview && !binding
                          ? "Awaiting restaurant connection"
                          : step.sub}
                      </Copy>
                    </p>
                  </div>
                </li>
              ))}
            </Copy>
          </ol>

          {binding ? (
            binding.location
          ) : (
            <CustomerPickupLocation
              name={t.name}
              orderId={order.id}
              actions={
                <Copy>
                  {preview ? null : (
                    <Button asChild variant="outline" className="mt-4">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.address)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MapPin /> <Copy> Get directions</Copy>
                      </a>
                    </Button>
                  )}
                </Copy>
              }
            >
              <p className="mt-2 text-sm text-muted-foreground">
                <Copy>{t.address}</Copy>
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                <Copy>{t.hours}</Copy>
              </p>
            </CustomerPickupLocation>
          )}
        </div>

        {binding?.summary ?? (
          <aside className="customer-summary min-w-0 border-t pt-6">
            <h2 className="text-lg font-bold">
              <Copy>Order summary</Copy>
            </h2>

            <OrderItems order={order} money={money} />

            <dl className="space-y-3 border-t pt-5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <dt>
                  <Copy>Subtotal</Copy>
                </dt>

                <dd>
                  <Copy>{money(order.subtotal)}</Copy>
                </dd>
              </div>

              <Copy>
                {order.discount > 0 && (
                  <div className="flex justify-between text-primary">
                    <dt>
                      <Copy>Discount</Copy>
                    </dt>

                    <dd>
                      −<Copy>{money(order.discount)}</Copy>
                    </dd>
                  </div>
                )}
              </Copy>

              <div className="flex justify-between text-muted-foreground">
                <dt>
                  <Copy>Pickup</Copy>
                </dt>

                <dd>
                  <Copy>Free</Copy>
                </dd>
              </div>

              {taxAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <dt>{checkout("tax")}</dt>

                  <dd>{money(taxAmount)}</dd>
                </div>
              )}

              <div className="flex justify-between border-t pt-4 text-lg font-bold">
                <dt>
                  <Copy>Total</Copy>
                </dt>

                <dd>
                  <Copy>{money(order.total)}</Copy>
                </dd>
              </div>
            </dl>

            <p className="mt-2 text-xs text-muted-foreground">
              <Copy>
                {binding
                  ? binding.statusLabel
                  : preview
                    ? "Taxes included"
                    : "Taxes included · Not charged"}
              </Copy>
            </p>

            <Copy>
              {order.notes && (
                <div className="mt-6 border-t pt-5">
                  <h3 className="text-sm font-semibold">
                    <Copy>Order notes</Copy>
                  </h3>

                  <p className="mt-2 text-sm break-words text-muted-foreground">
                    <Copy>{order.notes}</Copy>
                  </p>
                </div>
              )}
            </Copy>

            {t.phone && (
              <div className="mt-8 border-t pt-5">
                <p className="text-sm font-bold">
                  <Copy>Need a hand?</Copy>
                </p>

                <a
                  href={`tel:${t.phone.replace(/\s/g, "")}`}
                  className="mt-2 block text-sm text-primary"
                >
                  <Copy>Call </Copy>

                  <Copy>{t.phone}</Copy>
                </a>
              </div>
            )}

            <Copy>
              {!preview && !binding && (
                <Button asChild variant="outline" className="mt-6 w-full">
                  <Link to="/store">
                    <Copy>Back to menu</Copy>
                  </Link>
                </Button>
              )}
            </Copy>

            {binding?.actions}
          </aside>
        )}
      </div>
    </>
  )

  return binding?.embedded ? (
    content
  ) : (
    <CustomerShell
      t={t}
      preview={preview}
      headerActions={binding?.headerActions}
    >
      {content}
    </CustomerShell>
  )
}

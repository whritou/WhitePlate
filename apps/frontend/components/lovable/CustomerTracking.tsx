"use client"
import { Copy } from "@/components/lovable/copy"
import { Link } from "@/components/lovable/navigation"
import {
  Check,
  ChefHat,
  Clock3,
  MapPin,
  PackageCheck,
  ShoppingBag,
} from "lucide-react"
import { Button } from "@/components/ui/lovable-button"
import { CustomerShell } from "@/components/lovable/CustomerShell"
import { OrderItems } from "@/components/lovable/CustomerCheckout"
import type { CustomerOrder } from "@/lib/lovable/customerOrder"
import type { StoreTheme } from "@/lib/lovable/storeTheme"
export function CustomerTracking({
  t,
  order,
  preview = false,
}: {
  t: StoreTheme
  order: CustomerOrder | null
  preview?: boolean
}) {
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

  const stage = preview ? 1 : 0
  const steps = [
    {
      label: "Order received",
      sub: preview ? "Confirmed" : "Saved in this browser",
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

  return (
    <CustomerShell t={t} preview={preview}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-primary">
          <Copy>Order #</Copy>

          <Copy>{order.id}</Copy>
        </p>

        <span className="customer-rounded border px-3 py-1 text-xs font-semibold">
          <Copy>{preview ? "Preview order" : "Demo order · Not live"}</Copy>
        </span>
      </div>

      <div className="grid items-start gap-10 md:grid-cols-[1.15fr_1fr]">
        <div>
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Copy>{preview ? <ChefHat size={30} /> : <Check size={30} />}</Copy>
          </div>

          <h1 className="text-3xl font-bold">
            <Copy>
              {preview
                ? "Good food is on its way."
                : `Thanks, ${order.name.split(" ")[0] || "there"}!`}
            </Copy>
          </h1>

          <p className="mt-3 text-muted-foreground">
            <Copy>
              {preview
                ? "The kitchen is working on your order."
                : "Your demo order is saved. No payment was taken and the restaurant has not received it."}
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
                <Copy>{scheduled}</Copy>
              </p>
            </div>
          </div>

          <ol className="my-8">
            <Copy>
              {steps.map((step, i) => (
                <li
                  key={step.label}
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
                        {i > stage && !preview
                          ? "Awaiting restaurant connection"
                          : step.sub}
                      </Copy>
                    </p>
                  </div>
                </li>
              ))}
            </Copy>
          </ol>

          <section className="border-t pt-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <MapPin size={20} className="text-primary" />{" "}
              <Copy> Pickup location</Copy>
            </h2>

            <p className="font-semibold">
              <Copy>{t.name}</Copy>
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              <Copy>{t.address}</Copy>
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              <Copy>{t.hours}</Copy>
            </p>

            <p className="mt-4 text-sm">
              <Copy>Show </Copy>
              <strong>
                #<Copy>{order.id}</Copy>
              </strong>{" "}
              <Copy> at collection.</Copy>
            </p>

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
          </section>
        </div>

        <aside className="border-t pt-6 md:border-t-0 md:border-l md:pt-0 md:pl-8">
          <h2 className="text-lg font-bold">
            <Copy>Order summary</Copy>
          </h2>

          <OrderItems order={order} />

          <dl className="space-y-3 border-t pt-5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <dt>
                <Copy>Subtotal</Copy>
              </dt>

              <dd>
                €<Copy>{order.subtotal.toFixed(2)}</Copy>
              </dd>
            </div>

            <Copy>
              {order.discount > 0 && (
                <div className="flex justify-between text-primary">
                  <dt>
                    <Copy>Discount</Copy>
                  </dt>

                  <dd>
                    −€<Copy>{order.discount.toFixed(2)}</Copy>
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

            <div className="flex justify-between border-t pt-4 text-lg font-bold">
              <dt>
                <Copy>Total</Copy>
              </dt>

              <dd>
                €<Copy>{order.total.toFixed(2)}</Copy>
              </dd>
            </div>
          </dl>

          <p className="mt-2 text-xs text-muted-foreground">
            <Copy>
              {preview ? "Taxes included" : "Taxes included · Not charged"}
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

          <Copy>
            {!preview && (
              <Button asChild variant="outline" className="mt-6 w-full">
                <Link to="/store">
                  <Copy>Back to menu</Copy>
                </Link>
              </Button>
            )}
          </Copy>
        </aside>
      </div>
    </CustomerShell>
  )
}

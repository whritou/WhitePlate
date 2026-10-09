"use client"
import { Copy } from "@/components/lovable/copy"
import { Link } from "@/components/lovable/navigation"
import {
  ArrowRight,
  ArrowUpRight,
  CircleAlert,
  Radio,
  Check,
  Store,
} from "lucide-react"
import { Button } from "@/components/ui/lovable-button"

import { burger, bowl, euro } from "./dashboard-shared"
import { useDashboardPageView } from "./dashboard-DashboardPage-context"
import { DashboardPageSection1 } from "./dashboard-DashboardPage-section-1"
export function DashboardPageView() {
  const { orders, paused, setPaused, metrics } = useDashboardPageView()

  return (
    <main className="mx-auto max-w-[1600px] px-6 pb-12">
      <section className="flex flex-wrap items-end justify-between gap-5 py-8">
        <div>
          <p className="label-mono text-muted-foreground">
            <Copy>Maison Verte — Bastille · Sample service</Copy>
          </p>

          <h1 className="mt-2 font-display text-4xl font-bold">
            <Copy>Service at a glance.</Copy>
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setPaused((v) => !v)}>
            <Radio />

            <Copy>{paused ? "Resume demo orders" : "Pause demo orders"}</Copy>
          </Button>

          <Button asChild>
            <Link to="/orders">
              <Copy>Open order board</Copy>

              <ArrowUpRight />
            </Link>
          </Button>
        </div>
      </section>

      <section
        aria-label="Service metrics"
        className="grid border-y sm:grid-cols-2 xl:grid-cols-4"
      >
        <Copy>
          {metrics.map(({ label, value, note, icon: Icon }, i) => (
            <div
              key={label}
              className={`py-6 ${i ? "xl:border-l xl:pl-6" : ""} ${i < 3 ? "border-b xl:border-b-0" : ""}`}
            >
              <div className="flex flex-wrap items-center justify-between pr-6 text-muted-foreground">
                <span className="text-sm">
                  <Copy>{label}</Copy>
                </span>

                <Icon className="h-4 w-4" />
              </div>

              <p className="mt-3 font-display text-4xl font-bold">
                <Copy>{value}</Copy>
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                <Copy>{note}</Copy>
              </p>
            </div>
          ))}
        </Copy>
      </section>

      <DashboardPageSection1 />

      <div className="grid gap-8 border-t pt-7 xl:grid-cols-[1.55fr_1fr] [&>section]:min-w-0">
        <section aria-labelledby="recent-title">
          <div className="mb-5 flex flex-wrap items-center justify-between">
            <h2 id="recent-title" className="text-2xl font-bold">
              <Copy>Latest orders</Copy>
            </h2>

            <Button asChild variant="link" size="sm">
              <Link to="/orders">
                <Copy>View all</Copy>

                <ArrowRight />
              </Link>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead className="border-b text-xs text-muted-foreground">
                <tr>
                  <th className="pb-3 font-normal">
                    <Copy>Order / customer</Copy>
                  </th>

                  <th className="pb-3 font-normal">
                    <Copy>Pickup</Copy>
                  </th>

                  <th className="pb-3 font-normal">
                    <Copy>Status</Copy>
                  </th>

                  <th className="pb-3 text-right font-normal">
                    <Copy>Total</Copy>
                  </th>
                </tr>
              </thead>

              <tbody>
                <Copy>
                  {[...orders]
                    .sort((a, b) => Number(b.id) - Number(a.id))
                    .slice(0, 5)
                    .map((o) => (
                      <tr key={o.id} className="border-b">
                        <td className="py-3">
                          <Link
                            to="/orders"
                            className="font-bold hover:text-primary"
                          >
                            #<Copy>{o.id}</Copy>
                          </Link>

                          <p className="mt-1 text-xs text-muted-foreground">
                            <Copy>{o.customer}</Copy> · <Copy>{o.channel}</Copy>
                          </p>
                        </td>

                        <td>
                          <Copy>{o.pickup}</Copy>
                        </td>

                        <td>
                          <span className="inline-flex items-center gap-2 capitalize">
                            <span
                              className={`h-2 w-2 ${o.status === "new" ? "bg-accent" : "bg-primary"}`}
                            />

                            <Copy>{o.status}</Copy>
                          </span>
                        </td>

                        <td className="text-right font-medium">
                          <Copy>{euro(o.total)}</Copy>
                        </td>
                      </tr>
                    ))}
                </Copy>
              </tbody>
            </table>
          </div>
        </section>

        <section className="xl:border-l xl:pl-8">
          <div className="mb-5 flex flex-wrap items-center justify-between">
            <h2 className="text-2xl font-bold">
              <Copy>Your storefront</Copy>
            </h2>

            <Store className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <img
              src={burger}
              alt="Burger Maison sample dish"
              className="aspect-[2/1] w-full object-cover"
            />

            <img
              src={bowl}
              alt="Green bowl sample dish"
              className="aspect-[2/1] w-full object-cover"
            />
          </div>

          <h3 className="mt-4 text-lg font-bold">
            <Copy>Maison Verte</Copy>
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            <Copy>Bastille · Click & collect</Copy>
          </p>

          <p className="mt-4 flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary" />

            <Copy>Store preview available</Copy>
          </p>

          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <CircleAlert className="h-4 w-4" />

            <Copy>Checkout is not connected</Copy>
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/studio">
                <Copy>Edit storefront</Copy>

                <ArrowRight />
              </Link>
            </Button>

            <Button asChild variant="ghost">
              <Link to="/menu">
                <Copy>Manage menu</Copy>
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  )
}

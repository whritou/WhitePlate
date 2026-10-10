"use client"
import { Copy } from "@/components/lovable/copy"
import { Link } from "@/components/lovable/navigation"
import {
  ArrowRight,
  ArrowUpRight,
  CreditCard,
  Radio,
  Timer,
} from "lucide-react"
import { Button } from "@/components/ui/lovable-button"
import { stages } from "./dashboard-shared"
import { useDashboardPageView } from "./dashboard-DashboardPage-context"
export function DashboardPageSection1() {
  const { orders, paused, late } = useDashboardPageView()

  return (
    <div className="grid gap-8 py-8 xl:grid-cols-[1.55fr_1fr] [&>section]:min-w-0">
      <section aria-labelledby="kitchen-title">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 id="kitchen-title" className="font-display text-2xl font-bold">
            <Copy>In the kitchen</Copy>
          </h2>

          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className={`h-2 w-2 ${paused ? "bg-muted-foreground" : "bg-primary"}`}
            />

            <Copy>{paused ? "Demo paused" : "Demo service"}</Copy>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Copy>
            {stages.map(({ status, name, tone }) => (
              <Link
                key={status}
                to="/orders"
                className={`border p-4 transition-opacity hover:opacity-80 ${tone}`}
              >
                <p className="text-sm font-medium">
                  <Copy>{name}</Copy>
                </p>

                <p className="mt-4 text-4xl font-bold">
                  <Copy>
                    {orders.filter((o) => o.status === status).length}
                  </Copy>
                </p>

                <ArrowRight className="mt-5 h-4 w-4" />
              </Link>
            ))}
          </Copy>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y py-4">
          <div className="flex items-center gap-3">
            <Timer className="h-5 w-5 text-primary" />

            <div>
              <p className="text-sm font-medium">
                <Copy>{late.length}</Copy>{" "}
                <Copy> orders past the 12-minute target</Copy>
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                <Copy>
                  {late.map((o) => `#${o.id}`).join(" · ") ||
                    "No late sample orders"}
                </Copy>
              </p>
            </div>
          </div>

          <Button asChild variant="link" size="sm">
            <Link to="/orders">
              <Copy>Review orders</Copy>

              <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      <section
        aria-labelledby="connections-title"
        className="xl:border-l xl:pl-8"
      >
        <div className="mb-5 flex flex-wrap items-center justify-between">
          <h2
            id="connections-title"
            className="font-display text-2xl font-bold"
          >
            <Copy>Connections</Copy>
          </h2>

          <span className="border px-2 py-1 text-xs">
            <Copy>Demo workspace</Copy>
          </span>
        </div>

        <div className="border-y py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 font-bold">
              <CreditCard className="h-5 w-5" />

              <Copy>Stripe payments</Copy>
            </p>

            <span className="bg-secondary px-2 py-1 text-xs">
              <Copy>Not connected</Copy>
            </span>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">
            <Copy>
              No verified Stripe account. Charges and payouts are not available.
            </Copy>
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-between">
            <span className="text-xs text-primary">
              <Copy>WhitePlate commission · 0%</Copy>
            </span>

            <Button asChild variant="link" size="sm">
              <Link to="/settings" search={{ section: "payments" }}>
                <Copy>Payment settings</Copy>

                <ArrowUpRight />
              </Link>
            </Button>
          </div>
        </div>

        <div className="border-b py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 font-bold">
              <Radio className="h-5 w-5" />

              <Copy>Order connection</Copy>
            </p>

            <span className="bg-accent px-2 py-1 text-xs">
              <Copy>{paused ? "Demo paused" : "Sample feed"}</Copy>
            </span>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted-foreground">
              <Copy>Demo order feed</Copy>
            </dt>

            <dd className="text-right">
              <Copy>Not connected</Copy>
            </dd>

            <dt className="text-muted-foreground">
              <Copy>Last real order sync</Copy>
            </dt>

            <dd className="text-right">
              <Copy>Never</Copy>
            </dd>

            <dt className="text-muted-foreground">
              <Copy>Sample tickets</Copy>
            </dt>

            <dd className="text-right">
              <Copy>{orders.length}</Copy> <Copy> loaded</Copy>
            </dd>
          </dl>
        </div>
      </section>
    </div>
  )
}

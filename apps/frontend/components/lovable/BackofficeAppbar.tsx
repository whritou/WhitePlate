"use client"
import { Copy } from "@/components/lovable/copy"
import { Link } from "@/components/lovable/navigation"
import {
  ArrowUpRight,
  CreditCard,
  LayoutDashboard,
  ListOrdered,
  ChartNoAxesCombined,
  Utensils,
  Palette,
  Users,
  Settings,
  Radio,
  History,
} from "lucide-react"
import { Button } from "@/components/ui/lovable-button"
import { useBackoffice } from "@/lib/lovable/backoffice"
import { AccountControl } from "@/components/lovable/AccountControl"

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/orders", label: "Orders", icon: ListOrdered },
  { to: "/history", label: "History", icon: History },
  { to: "/analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { to: "/menu", label: "Menu", icon: Utensils },
  { to: "/studio", label: "Studio", icon: Palette },
  { to: "/staff", label: "Staff", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
] as const

export function BackofficeAppbar() {
  const { paused } = useBackoffice()

  return (
    <header
      className="shrink-0 border-b bg-background print:hidden"
      aria-label="Back-office appbar"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div className="flex items-center gap-5">
          <Link to="/dashboard" className="font-display text-2xl font-bold">
            <Copy>White</Copy>

            <span className="text-primary">
              <Copy>Plate</Copy>
            </span>
          </Link>

          <span className="hidden border-l pl-5 text-sm text-muted-foreground sm:block">
            <Copy>Restaurant workspace</Copy>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link
              to="/settings"
              search={{ section: "payments" }}
              title="Stripe is not connected to a real account"
            >
              <CreditCard />

              <Copy>Stripe · Not connected</Copy>
            </Link>
          </Button>

          <Button asChild variant="secondary" size="sm">
            <Link
              to="/dashboard"
              title="Sample orders only; no live order feed"
            >
              <Radio />

              <Copy>Orders · </Copy>

              <Copy>{paused ? "Demo paused" : "Demo feed"}</Copy>
            </Link>
          </Button>

          <Button asChild variant="outline" size="sm">
            <Link to="/store">
              <Copy>View store</Copy>

              <ArrowUpRight />
            </Link>
          </Button>

          <AccountControl />
        </div>
      </div>

      <nav
        aria-label="Back-office navigation"
        className="flex gap-1 overflow-x-auto border-t px-4 py-2"
      >
        <Copy>
          {links.map(({ to, label, icon: Icon }) => (
            <Button
              key={to}
              asChild
              variant="ghost"
              size="sm"
              className="shrink-0"
            >
              <Link
                to={to}
                activeProps={{
                  className: "lovable-selected",
                }}
              >
                <Icon />

                <Copy>{label}</Copy>
              </Link>
            </Button>
          ))}
        </Copy>
      </nav>
    </header>
  )
}

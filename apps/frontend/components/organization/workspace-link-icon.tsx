import {
  Utensils,
  ListOrdered,
  ChartNoAxesCombined,
  History,
  Languages,
  LayoutDashboard,
  Plus,
  Settings,
  Palette,
  Users,
} from "lucide-react"

export function WorkspaceLinkIcon({ href }: { href: string }) {
  const path = href.split("?", 1)[0]
  const Icon = path.endsWith("/team")
    ? Users
    : path.endsWith("/settings") || path.endsWith("/restaurant-settings")
      ? Settings
      : path.endsWith("/new")
        ? Plus
        : path.endsWith("/catalog")
          ? Utensils
          : path.endsWith("/restaurant-languages")
            ? Languages
            : path.endsWith("/order-history")
              ? History
              : path.endsWith("/orders")
                ? ListOrdered
                : path.endsWith("/theming")
                  ? Palette
                  : path.endsWith("/analytics")
                    ? ChartNoAxesCombined
                    : LayoutDashboard

  return <Icon aria-hidden="true" className="size-4 shrink-0" />
}

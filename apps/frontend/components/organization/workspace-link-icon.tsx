import {
  BookOpen,
  History,
  Languages,
  LayoutDashboard,
  Plus,
  Settings2,
  Palette,
  UsersRound,
  UtensilsCrossed,
} from "lucide-react"

export function WorkspaceLinkIcon({ href }: { href: string }) {
  const path = href.split("?", 1)[0]
  const Icon = path.endsWith("/team")
    ? UsersRound
    : path.endsWith("/settings")
      ? Settings2
      : path.endsWith("/new")
        ? Plus
        : path.endsWith("/catalog")
          ? BookOpen
          : path.endsWith("/restaurant-languages")
            ? Languages
            : path.endsWith("/order-history")
              ? History
              : path.endsWith("/orders")
                ? UtensilsCrossed
                : path.endsWith("/theming")
                  ? Palette
                  : LayoutDashboard

  return <Icon aria-hidden="true" className="size-5 shrink-0" />
}

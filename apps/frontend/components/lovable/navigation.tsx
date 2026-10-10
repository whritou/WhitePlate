"use client"
import type { ComponentProps } from "react"
import { Link as LocaleLink, useRouter, usePathname } from "@/i18n/navigation"

const destinations: Record<string, string> = {
  "/store": "/demo",
  "/checkout": "/demo/checkout",
  "/dashboard": "/demo/dashboard",
  "/orders": "/demo/orders",
  "/history": "/demo/history",
  "/analytics": "/demo/analytics",
  "/menu": "/demo/menu",
  "/studio": "/demo/studio",
  "/staff": "/demo/staff",
  "/settings": "/demo/settings",
  "/auth": "/sign-in",
  "/login": "/sign-in",
  "/register": "/sign-up",
  "/track/$orderId": "/demo/tracking",
}

export function Link({
  to,
  search,
  activeProps,
  children,
  ...props
}: Omit<ComponentProps<typeof LocaleLink>, "href"> & {
  to: string
  search?: Record<string, string>
  activeProps?: { className: string }
}) {
  const pathname = usePathname()
  const target = destinations[to] ?? to
  const query = search ? `?${new URLSearchParams(search)}` : ""

  return (
    <LocaleLink
      href={target + query}
      {...props}
      className={`${props.className ?? ""} ${pathname === target ? (activeProps?.className ?? "") : ""}`}
    >
      {children}
    </LocaleLink>
  )
}

export function useNavigate() {
  const router = useRouter()

  return ({ to, params }: { to: string; params?: Record<string, string> }) =>
    router.push(
      (destinations[to] ?? to) +
        (params?.orderId
          ? `?orderId=${encodeURIComponent(params.orderId)}`
          : "")
    )
}

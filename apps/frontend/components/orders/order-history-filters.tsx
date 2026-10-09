"use client"

import { ListFilter, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Link } from "@/i18n/navigation"
import type { OrderHistoryFilters } from "@/types/orders"

export function OrderHistoryFilters({
  filters,
}: {
  filters: OrderHistoryFilters
}) {
  const t = useTranslations("OrderHistory")
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <div
        data-testid="order-history-desktop-filters"
        className="hidden lg:block"
      >
        <Card>
          <CardHeader>
            <CardTitle>{t("filtersTitle")}</CardTitle>
          </CardHeader>

          <CardContent>
            <FilterFields filters={filters} variant="desktop" />
          </CardContent>
        </Card>
      </div>

      <div data-testid="order-history-mobile-filters" className="lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button
                type="button"
                variant="outline"
                aria-label={t("filtersButton")}
                className="w-full justify-start sm:w-auto"
              />
            }
          >
            <ListFilter aria-hidden="true" />

            {t("filtersButton")}
          </SheetTrigger>

          <SheetContent
            side="right"
            aria-label={t("filtersTitle")}
            className="gap-0 overflow-y-hidden p-0"
          >
            <SheetHeader className="relative shrink-0 border-b border-border p-5 pr-16">
              <SheetTitle>{t("filtersTitle")}</SheetTitle>

              <SheetDescription>{t("filtersDescription")}</SheetDescription>

              <SheetClose
                aria-label={t("closeFilters")}
                className="absolute top-5 right-5 inline-flex size-11 items-center justify-center rounded-md text-foreground hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:bg-surface-dim"
              >
                <X aria-hidden="true" className="size-4" />
              </SheetClose>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <FilterFields
                filters={filters}
                variant="mobile"
                onApplied={() => setMobileOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}

function FilterFields({
  filters,
  variant,
  onApplied,
}: {
  filters: OrderHistoryFilters
  variant: "desktop" | "mobile"
  onApplied?: () => void
}) {
  const t = useTranslations("OrderHistory")
  const suffix = variant === "desktop" ? "desktop" : "mobile"
  const formClassName =
    variant === "desktop"
      ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(10rem,1fr)_repeat(3,minmax(6.5rem,0.75fr))_auto]"
      : "grid gap-4"

  return (
    <form
      method="get"
      data-filter-form={variant}
      className={formClassName}
      onSubmit={onApplied}
    >
      <input type="hidden" name="tenantId" value={filters.tenantId} />

      <div className="grid min-w-0 gap-2 text-sm font-medium sm:col-span-2 lg:col-span-1">
        <Label htmlFor={`history-search-${suffix}`}>{t("search")}</Label>

        <Input
          id={`history-search-${suffix}`}
          name="search"
          defaultValue={filters.search ?? ""}
          placeholder={t("searchPlaceholder")}
        />
      </div>

      <div className="grid min-w-0 gap-2 text-sm font-medium">
        <Label htmlFor={`history-status-${suffix}`}>{t("status")}</Label>

        <NativeSelect
          id={`history-status-${suffix}`}
          name="status"
          defaultValue={filters.status ?? "all"}
        >
          <NativeSelectOption value="all">
            {t("allStatuses")}
          </NativeSelectOption>

          {(
            ["Pending", "Preparing", "Ready", "Completed", "Cancelled"] as const
          ).map((status) => (
            <NativeSelectOption key={status} value={status}>
              {t(`statuses.${status}`)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      <div className="grid min-w-0 gap-2 text-sm font-medium">
        <Label htmlFor={`history-from-${suffix}`}>{t("from")}</Label>

        <Input
          id={`history-from-${suffix}`}
          type="date"
          name="from"
          defaultValue={filters.from ?? ""}
        />
      </div>

      <div className="grid min-w-0 gap-2 text-sm font-medium">
        <Label htmlFor={`history-through-${suffix}`}>{t("through")}</Label>

        <Input
          id={`history-through-${suffix}`}
          type="date"
          name="through"
          defaultValue={filters.through ?? ""}
        />
      </div>

      <input type="hidden" name="sort" value={filters.sort} />

      <input type="hidden" name="direction" value={filters.direction} />

      <input type="hidden" name="pageSize" value={filters.pageSize} />

      <div
        data-filter-actions
        className={`flex items-end justify-end gap-2 ${variant === "desktop" ? "sm:col-span-2 lg:col-span-1 lg:col-start-5 lg:justify-self-end" : "flex-wrap"}`}
      >
        <Button type="submit" onClick={onApplied}>
          {t("applyFilters")}
        </Button>

        <Button
          variant="outline"
          nativeButton={false}
          role="link"
          render={
            <Link
              href={`/organization/order-history?tenantId=${encodeURIComponent(filters.tenantId)}`}
              onClick={onApplied}
            />
          }
        >
          {t("clearFilters")}
        </Button>
      </div>
    </form>
  )
}

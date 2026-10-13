"use client"

import { RotateCcw, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { OrderFilterToolbarProps } from "@/types/orders"
import { useTranslations } from "next-intl"

const pickupFilters = ["all", "asap", "scheduled", "unrecorded"] as const

export function OrderFilterToolbar({
  search,
  pickupMode,
  visibleCount,
  loadedCount,
  onSearchChange,
  onPickupModeChange,
  onClear,
}: OrderFilterToolbarProps) {
  const t = useTranslations("KitchenOrders")
  const filtersActive = search.trim().length > 0 || pickupMode !== "all"

  return (
    <div className="grid min-w-0 gap-3">
      <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0 flex-1">
          <Label
            htmlFor="order-search"
            className="label-mono mb-1 block text-muted-foreground"
          >
            {t("searchLoadedOrders")}
          </Label>

          <div className="relative min-w-0">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />

            <Input
              id="order-search"
              type="search"
              className="min-h-12 pl-10 xl:min-h-11"
              maxLength={120}
              value={search}
              placeholder={t("searchLoadedPlaceholder")}
              onChange={(event) => onSearchChange(event.currentTarget.value)}
            />
          </div>
        </div>

        <fieldset className="min-w-0">
          <legend className="label-mono mb-1 text-muted-foreground">
            {t("pickupFilterLabel")}
          </legend>

          <div
            role="group"
            aria-label={t("pickupFilterLabel")}
            className="flex flex-wrap gap-2"
          >
            {pickupFilters.map((filter) => (
              <Button
                key={filter}
                type="button"
                variant={pickupMode === filter ? "default" : "outline"}
                className="min-h-12 xl:min-h-11"
                aria-pressed={pickupMode === filter}
                onClick={() => onPickupModeChange(filter)}
              >
                {t(`pickupModes.${filter}`)}
              </Button>
            ))}
          </div>
        </fieldset>

        {filtersActive && (
          <Button
            type="button"
            variant="outline"
            className="min-h-12 xl:min-h-11"
            onClick={onClear}
          >
            <RotateCcw aria-hidden="true" />

            {t("clearFilters")}
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {t("showingLoadedOrders", { visibleCount, loadedCount })}
      </p>
    </div>
  )
}

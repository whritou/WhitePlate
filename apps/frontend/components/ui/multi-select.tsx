"use client"

import { useState } from "react"
import { ChevronDown, X } from "lucide-react"
import { Popover } from "@base-ui/react/popover"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useVisualScope } from "@/components/ui/visual-scope"
import type { MultiSelectProps } from "@/types/ui"

function MultiSelect({
  id,
  name,
  label,
  options,
  defaultValue = [],
  placeholder,
  selectedCountLabel,
  clearLabel,
  disabled,
  describedBy,
}: MultiSelectProps) {
  const scope = useVisualScope()
  const [selectedValues, setSelectedValues] = useState<string[]>([
    ...defaultValue,
  ])
  const selectedOptions = options.filter((option) =>
    selectedValues.includes(option.value)
  )
  const summary =
    selectedOptions.length === 0
      ? placeholder
      : selectedOptions.length === 1
        ? selectedOptions[0].label
        : selectedCountLabel(selectedOptions.length)

  function toggleValue(value: string, checked: boolean) {
    setSelectedValues((current) =>
      checked
        ? current.includes(value)
          ? current
          : [...current, value]
        : current.filter((item) => item !== value)
    )
  }

  return (
    <div className="grid min-w-0 gap-2" data-slot="multi-select">
      {selectedValues.map((value) => (
        <input key={value} type="hidden" name={name} value={value} />
      ))}

      <Popover.Root>
        <Popover.Trigger
          id={id}
          aria-label={label}
          aria-describedby={describedBy}
          render={
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className="w-full min-w-0 justify-between gap-3 text-left font-normal"
            />
          }
        >
          <span className="min-w-0 flex-1 truncate">{summary}</span>
          <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Positioner
            sideOffset={4}
            align="start"
            className="z-50 w-[var(--anchor-width)] min-w-56"
          >
            <Popover.Popup
              className={cn(
                "max-h-72 overflow-y-auto rounded-md border border-border bg-popover p-2 text-popover-foreground shadow-lg outline-none",
                scope.className
              )}
              style={scope.style}
            >
              <div className="flex items-center justify-between gap-3 border-b border-border px-2 pb-2">
                <span
                  className="text-sm text-muted-foreground"
                  aria-live="polite"
                >
                  {selectedCountLabel(selectedValues.length)}
                </span>

                {selectedValues.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-8 px-2"
                    disabled={disabled}
                    onClick={() => setSelectedValues([])}
                    aria-label={clearLabel}
                  >
                    <X aria-hidden="true" className="size-4" />
                  </Button>
                )}
              </div>

              <div role="group" aria-label={label} className="grid gap-1 pt-2">
                {options.map((option) => {
                  const optionId = `${id}-${option.value}`

                  return (
                    <Label
                      key={option.value}
                      htmlFor={optionId}
                      className={cn(
                        "flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-2 py-1.5 text-sm focus-within:bg-muted hover:bg-muted",
                        selectedValues.includes(option.value) && "bg-muted"
                      )}
                    >
                      <Checkbox
                        id={optionId}
                        disabled={disabled}
                        checked={selectedValues.includes(option.value)}
                        onCheckedChange={(checked) =>
                          toggleValue(option.value, checked === true)
                        }
                      />
                      <span className="min-w-0 flex-1">{option.label}</span>
                    </Label>
                  )
                })}
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}

export { MultiSelect }

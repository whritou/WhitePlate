import { cn } from "@/lib/utils"
import type { MultiSelectListProps } from "@/types/ui"

function MultiSelectList({
  className,
  options,
  ...props
}: MultiSelectListProps) {
  return (
    <select
      data-slot="multi-select-list"
      className={cn(
        "min-h-40 w-full min-w-0 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground",
        className
      )}
      {...props}
    >
      {options.map(({ value, label }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  )
}

export { MultiSelectList }

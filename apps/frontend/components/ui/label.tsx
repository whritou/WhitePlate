"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-3 text-base leading-6 font-medium select-none peer-disabled:cursor-not-allowed has-data-[slot=checkbox]:min-h-11 has-data-[slot=radio-group-item]:min-h-11",
        className
      )}
      {...props}
    />
  )
}

export { Label }

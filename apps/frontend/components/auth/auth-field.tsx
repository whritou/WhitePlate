"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AuthField({
  id,
  label,
  type = "text",
  autoComplete,
  required = true,
  icon,
}: {
  id: string
  label: string
  type?: string
  autoComplete?: string
  required?: boolean
  icon?: React.ReactNode
}) {
  return (
    <Label
      className="grid gap-2 text-sm font-medium text-foreground"
      htmlFor={id}
    >
      {label}

      <span className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-muted-foreground">
            {icon}
          </span>
        )}

        <Input
          id={id}
          name={id}
          type={type}
          autoComplete={autoComplete}
          required={required}
          className={`h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground transition outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 ${icon ? "ps-10" : ""}`}
        />
      </span>
    </Label>
  )
}

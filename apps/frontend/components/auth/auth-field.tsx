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
  placeholder,
}: {
  id: string
  label: string
  type?: string
  autoComplete?: string
  required?: boolean
  icon?: React.ReactNode
  placeholder?: string
}) {
  return (
    <Label className="grid gap-2 font-medium text-foreground" htmlFor={id}>
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
          placeholder={placeholder}
          required={required}
          className={icon ? "ps-10" : undefined}
        />
      </span>
    </Label>
  )
}

"use client"
import { Copy } from "@/components/shared/translated-copy"
import {
  SourceLabel,
  SourceOption,
  SourceSelect,
} from "@/components/ui/lovable-controls"
import { FONTS } from "@/lib/lovable/storeTheme"

export function StudioFontSelect({
  label,
  value,
  onChange,
  connected,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  connected?: boolean
}) {
  return (
    <SourceLabel className="block space-y-2 text-sm font-medium">
      <Copy>{label}</Copy>
      <SourceSelect
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border bg-background p-2"
      >
        <Copy>
          {(connected ? [...FONTS, "Inter"] : FONTS).map((font) => (
            <SourceOption key={font} value={font}>
              <Copy>{font}</Copy>
            </SourceOption>
          ))}
        </Copy>
      </SourceSelect>
    </SourceLabel>
  )
}

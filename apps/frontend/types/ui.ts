import type { ComponentProps } from "react"
import type { Dialog } from "@base-ui/react/dialog"

export type NativeSelectProps = Omit<ComponentProps<"select">, "size"> & {
  size?: "sm" | "default"
  selectClassName?: string
}

export type MultiSelectOption = { value: string; label: string }
export type MultiSelectProps = {
  id: string
  name: string
  label: string
  options: readonly MultiSelectOption[]
  defaultValue?: readonly string[]
  placeholder: string
  selectedCountLabel: (count: number) => string
  clearLabel: string
  disabled?: boolean
  describedBy?: string
}

export type SheetContentProps = Dialog.Popup.Props & {
  keepMounted?: boolean
  side?: "left" | "right"
}

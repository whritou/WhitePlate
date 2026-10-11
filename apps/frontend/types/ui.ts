import type { ComponentProps } from "react"
import type { Dialog } from "@base-ui/react/dialog"

export type NativeSelectProps = Omit<ComponentProps<"select">, "size"> & {
  size?: "sm" | "default"
  selectClassName?: string
}

export type MultiSelectOption = { value: string; label: string }
export type MultiSelectListProps = Omit<
  ComponentProps<"select">,
  "children"
> & {
  options: readonly MultiSelectOption[]
}

export type SheetContentProps = Dialog.Popup.Props & {
  keepMounted?: boolean
  side?: "left" | "right"
}

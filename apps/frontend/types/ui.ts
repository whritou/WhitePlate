import type { ComponentProps } from "react"
import type { Dialog } from "@base-ui/react/dialog"

export type NativeSelectProps = Omit<ComponentProps<"select">, "size"> & {
  size?: "sm" | "default"
  selectClassName?: string
}

export type SheetContentProps = Dialog.Popup.Props & {
  side?: "left" | "right"
}

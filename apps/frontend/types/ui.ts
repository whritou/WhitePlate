import type { ComponentProps } from "react"

export type NativeSelectProps = Omit<ComponentProps<"select">, "size"> & {
  size?: "sm" | "default"
  selectClassName?: string
}

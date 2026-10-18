import type { CSSProperties } from "react"
import type { StoreTheme } from "@/types/lovable/storeTheme"

export type VisualScope = {
  className: string
  style?: CSSProperties
  buttonStyle?: StoreTheme["buttonStyle"]
}

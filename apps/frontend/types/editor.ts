import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

export type EditorCallbacks = {
  onSuccess?: () => void
  onPendingChange?: (pending: boolean) => void
  onCancel?: () => void
}
export type EditorDialogProps = {
  title: string
  description: string
  label: string
  icon?: LucideIcon
  primary?: boolean
  compact?: boolean
  disabled?: boolean
  children: (callbacks: EditorCallbacks) => ReactNode
}

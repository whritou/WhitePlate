import type { ReactNode } from "react"
import type { FormEventHandler } from "react"

export type CustomerStoreBinding = {
  locked: boolean
  headerActions: ReactNode
  restaurantInfo: ReactNode
  bannerBadge?: ReactNode
  onCheckout: () => void
  discountNote: ReactNode
}

export type CustomerCheckoutBinding = {
  taxAmount?: number
  money: (value: number) => string
  onSubmit: FormEventHandler<HTMLFormElement>
  details: ReactNode
  footer: ReactNode
  priceNote: ReactNode
  locked: boolean
  onEdit: () => void
}

export type CustomerTrackingBinding = {
  embedded?: boolean
  money?: (value: number) => string
  stage: number
  statusLabel: string
  heading: string
  description: string
  pickup: string
  location: ReactNode
  summary?: ReactNode
  headerActions: ReactNode
  taxAmount?: number
  actions?: ReactNode
}
export type CustomerContactFieldsProps = {
  name: string
  setName: (value: string) => void
  email: string
  setEmail: (value: string) => void
  phone: string
  setPhone: (value: string) => void
  notes: string
  setNotes: (value: string) => void
  emailControls?: import("react").ReactNode
}

export type CustomerPickupChoicesProps = {
  value: string
  onChange: (value: string) => void
  slots: { value: string; label: string }[]
  disabled?: boolean
  asapDescription: ReactNode
}

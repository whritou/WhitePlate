export type OrderEmailTemplate = {
  subject: string
  heading: string
  body: string
}

export type OrderEmailEventKey = "orderCreated" | "preparing" | "ready"

export const orderEmailPlaceholderKeys = [
  "customerName",
  "restaurantName",
  "orderNumber",
  "orderSummary",
  "pickupTime",
  "pickupInstructions",
  "trackingUrl",
] as const

export type OrderEmailPlaceholderKey =
  (typeof orderEmailPlaceholderKeys)[number]

export type OrderEmailTemplateFieldKey = keyof OrderEmailTemplate

export type OrderEmailPlaceholderInsertRequest = {
  id: number
  field: OrderEmailTemplateFieldKey | null
  placeholder: OrderEmailPlaceholderKey
}

export type OrderEmailTemplateFieldProps = {
  field: OrderEmailTemplateFieldKey
  id: string
  label: string
  value: string
  placeholderLabels: Record<OrderEmailPlaceholderKey, string>
  multiline: boolean
  maxLength: number
  disabled: boolean
  insertRequest: OrderEmailPlaceholderInsertRequest
  onChange: (value: string) => void
  onFocusField: (field: OrderEmailTemplateFieldKey) => void
  onInsertLimit: () => void
}

export type OrderEmailLocaleTemplates = {
  locale: string
  orderCreated: OrderEmailTemplate
  preparing: OrderEmailTemplate
  ready: OrderEmailTemplate
}

export type OrderEmailSettings = {
  version: number
  defaultLocale: string
  locales: string[]
  templates: OrderEmailLocaleTemplates[]
  defaults: OrderEmailLocaleTemplates[]
}

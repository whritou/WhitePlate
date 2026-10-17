export type OrderEmailTemplate = {
  subject: string
  heading: string
  body: string
}

export type OrderEmailEventKey = "orderCreated" | "preparing" | "ready"

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

export type MenuLanguagesInput = {
  tenantId: string
  locales: string[]
  defaultLocale: string
}
export type CatalogTranslationInput = {
  tenantId: string
  entityType: "categories" | "products" | "option-groups" | "options"
  entityId: string
  locale: string
  name: string
  description: string | null
}
export type StaffRole =
  "OrganizationOwner" | "RestaurantManager" | "KitchenStaff"
export type StaffInvitationInput = {
  organizationId: string
  tenantId: string | null
  email: string
  role: StaffRole
  locale: "en" | "fr"
}

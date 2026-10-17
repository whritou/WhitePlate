export type MenuLanguagesInput = {
  tenantId: string
  locales: string[]
  defaultLocale: string
}
export type RestaurantDescriptionTranslationInput = {
  tenantId: string
  locale: string
  description: string
}
export type OrganizationRenameInput = {
  organizationId: string
  name: string
}
export type CatalogTranslationInput = {
  tenantId: string
  entityType: "categories" | "products" | "option-groups" | "options"
  entityId: string
  locale: string
  name: string
  description: string | null
}
export type CatalogTranslationDecisionInput = {
  tenantId: string
  reviewId: string
  expectedVersion: number
  decision: "approve" | "reject"
}
export type CatalogTranslationGlossaryInput = {
  tenantId: string
  id: string | null
  sourceLocale: string
  targetLocale: string
  sourceTerm: string
  targetTerm: string
}
export type CatalogTranslationGlossaryDeleteInput = {
  tenantId: string
  id: string
}
export type StaffRole =
  | "OrganizationOwner"
  | "RestaurantManager"
  | "KitchenStaff"
  | "RestaurantStaff"
  | "Accountant"
export type StaffInvitationInput = {
  organizationId: string
  tenantId: string | null
  email: string
  role: StaffRole
  locale: "en" | "fr"
}

export type RevokeStaffInvitationInput = {
  organizationId: string
  invitationId: string
}

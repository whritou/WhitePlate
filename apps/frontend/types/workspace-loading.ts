export type WorkspaceLoadingPage =
  | "overview"
  | "analytics"
  | "dashboard"
  | "organizationSignUp"
  | "team"
  | "restaurant"
  | "catalog"
  | "menuLanguages"
  | "settings"
  | "restaurantSettings"
  | "orders"
  | "orderHistory"
  | "theming"

export type WorkspaceLoadingTranslationKey =
  | "organizationSignUp"
  | "team"
  | "restaurant"
  | "catalog"
  | "menuLanguages"
  | "settings"
  | "orders"
  | "orderHistory"

export type WorkspacePageSkeletonProps = {
  page: WorkspaceLoadingPage
  label: string
}

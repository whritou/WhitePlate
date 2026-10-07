export type WorkspaceLoadingPage =
  | "organizationSignUp"
  | "team"
  | "restaurant"
  | "catalog"
  | "menuLanguages"
  | "settings"
  | "orders"
  | "orderHistory"

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

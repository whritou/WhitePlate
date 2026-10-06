export type WorkspaceLoadingPage =
  | "organizationSignUp"
  | "team"
  | "restaurant"
  | "catalog"
  | "menuLanguages"
  | "settings"
  | "orders"

export type WorkspaceLoadingTranslationKey =
  | "organizationSignUp"
  | "team"
  | "restaurant"
  | "catalog"
  | "menuLanguages"
  | "settings"
  | "orders"

export type WorkspacePageSkeletonProps = {
  page: WorkspaceLoadingPage
  label: string
}

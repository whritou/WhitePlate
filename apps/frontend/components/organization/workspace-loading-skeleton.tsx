import { WorkspacePageSkeleton } from "./workspace-page-skeletons"

export function WorkspaceLoadingSkeleton({ label }: { label: string }) {
  return <WorkspacePageSkeleton page="overview" label={label} />
}

"use client"
import { useStudioPageModel } from "./studio-StudioPage-model"
import { StudioPageProvider } from "./studio-StudioPage-context"
import { StudioPageView } from "./studio-StudioPage-view"
export function StudioPage({ storageKey }: { storageKey?: string }) {
  const model = useStudioPageModel(storageKey)

  return (
    <StudioPageProvider model={model}>
      <StudioPageView />
    </StudioPageProvider>
  )
}

export { DnsModal, ImagePick, Group, Field } from "./studio-shared"

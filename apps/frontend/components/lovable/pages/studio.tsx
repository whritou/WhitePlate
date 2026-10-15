"use client"
import { useStudioPageModel } from "./studio-StudioPage-model"
import { StudioPageProvider } from "./studio-StudioPage-context"
import { StudioPageView } from "./studio-StudioPage-view"
import type { StudioController } from "@/types/theme"
export function StudioPage({
  storageKey,
  controller,
}: {
  storageKey?: string
  controller?: StudioController
}) {
  const model = useStudioPageModel(storageKey, controller)

  return (
    <StudioPageProvider model={model}>
      <StudioPageView />
    </StudioPageProvider>
  )
}

export { DnsModal, ImagePick, Group, Field } from "./studio-shared"

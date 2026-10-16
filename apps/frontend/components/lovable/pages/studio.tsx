"use client"
import type { ReactNode } from "react"
import { useStudioPageModel } from "./studio-StudioPage-model"
import { StudioPageProvider } from "./studio-StudioPage-context"
import { StudioPageView } from "./studio-StudioPage-view"
import type { StudioController, StudioNavigation } from "@/types/theme"
export function StudioPage({
  storageKey,
  controller,
  brandAssets,
}: {
  storageKey?: string
  controller?: StudioController & StudioNavigation
  brandAssets?: ReactNode
}) {
  const model = useStudioPageModel(storageKey, controller, brandAssets)

  return (
    <StudioPageProvider model={model}>
      <StudioPageView />
    </StudioPageProvider>
  )
}

export { DnsModal, ImagePick, Group, Field } from "./studio-shared"

"use client"
import type { ReactNode } from "react"
import { useStudioPageModel } from "../../../workspace/studio/page/model"
import { StudioPageProvider } from "../../../workspace/studio/page/context"
import { StudioPageView } from "../../../workspace/studio/page/view"
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

export { DnsModal, ImagePick, Group, Field } from "../../../workspace/studio/page/shared"

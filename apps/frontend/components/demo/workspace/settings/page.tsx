"use client"
import { useSettingsPageModel } from "../../../workspace/settings/page/model"
import { SettingsPageProvider } from "../../../workspace/settings/page/context"
import { SettingsPageView } from "../../../workspace/settings/page/view"
export function SettingsPage() {
  const model = useSettingsPageModel()

  return (
    <SettingsPageProvider model={model}>
      <SettingsPageView />
    </SettingsPageProvider>
  )
}

export {
  KEY,
  DEFAULT,
  PLANS,
  SECTIONS,
  input,
  Card,
  Field,
  Badge,
} from "../../../workspace/settings/page/shared"

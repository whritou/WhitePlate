"use client"
import { useSettingsPageModel } from "./settings-SettingsPage-model"
import { SettingsPageProvider } from "./settings-SettingsPage-context"
import { SettingsPageView } from "./settings-SettingsPage-view"
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
} from "./settings-shared"

"use client"
import { useAnalyticsPageModel } from "./analytics-AnalyticsPage-model"
import { AnalyticsPageProvider } from "./analytics-AnalyticsPage-context"
import { AnalyticsPageView } from "./analytics-AnalyticsPage-view"
export function AnalyticsPage() {
  const model = useAnalyticsPageModel()

  return (
    <AnalyticsPageProvider model={model}>
      <AnalyticsPageView />
    </AnalyticsPageProvider>
  )
}

export {
  RESTAURANTS,
  RANGES,
  DISHES,
  PRICES,
  C,
  useThemeColors,
  rng,
  build,
  eur,
  pct,
} from "./analytics-shared"

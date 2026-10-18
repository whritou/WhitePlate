"use client"
import { useAnalyticsPageModel } from "../../../workspace/analytics/page/model"
import { AnalyticsPageProvider } from "../../../workspace/analytics/page/context"
import { AnalyticsPageView } from "../../../workspace/analytics/page/view"
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
} from "../../../workspace/analytics/page/shared"

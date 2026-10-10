"use client"
import { useHistoryPageModel } from "./history-HistoryPage-model"
import { HistoryPageProvider } from "./history-HistoryPage-context"
import { HistoryPageView } from "./history-HistoryPage-view"
export function HistoryPage() {
  const model = useHistoryPageModel()

  return (
    <HistoryPageProvider model={model}>
      <HistoryPageView />
    </HistoryPageProvider>
  )
}

export {
  DISHES,
  NAMES,
  seeded,
  makeOrders,
  subtotal,
  total,
  vat,
  fmtDate,
  fmtTime,
  eur,
  PAGE,
  Bill,
} from "./history-shared"

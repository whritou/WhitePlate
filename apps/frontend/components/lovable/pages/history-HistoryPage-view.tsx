"use client"
import { Copy } from "@/components/lovable/copy"
import { Bill } from "./history-shared"
import { useHistoryPageView } from "./history-HistoryPage-context"
import { HistoryPageSection1 } from "./history-HistoryPage-section-1"
export function HistoryPageView() {
  const { bill, setBill } = useHistoryPageView()

  return (
    <div className="min-h-screen bg-background">
      <HistoryPageSection1 />

      <Copy>{bill && <Bill o={bill} onClose={() => setBill(null)} />}</Copy>
    </div>
  )
}

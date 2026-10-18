"use client"
import { Copy } from "@/components/shared/translated-copy"
import { Bill } from "./shared"
import { useHistoryPageView } from "./context"
import { HistoryPageSection1 } from "./sections/section-01"
export function HistoryPageView() {
  const { bill, setBill } = useHistoryPageView()

  return (
    <div className="min-h-screen bg-background">
      <HistoryPageSection1 />

      <Copy>{bill && <Bill o={bill} onClose={() => setBill(null)} />}</Copy>
    </div>
  )
}

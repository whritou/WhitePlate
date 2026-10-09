"use client"
import { Copy } from "@/components/lovable/copy"
import { SourceInput, SourceLabel } from "@/components/ui/lovable-controls"

import { Card } from "./settings-shared"
import { useSettingsPageView } from "./settings-SettingsPage-context"
export function SettingsPanel5() {
  const { s, sec, update } = useSettingsPageView()

  return (
    <Copy>
      {sec === "notifications" && (
        <Card
          title="Notifications"
          sub="Sent to the organization owners by email and push."
        >
          <Copy>
            {(
              [
                [
                  "newOrder",
                  "New order received",
                  "Sound + push on the kitchen board",
                ],
                [
                  "lateOrder",
                  "Late order alert",
                  "When an order exceeds prep time",
                ],
                [
                  "dailyReport",
                  "Daily summary",
                  "Revenue and orders every morning at 8:00",
                ],
                [
                  "weeklyReport",
                  "Weekly report",
                  "KPIs per restaurant every Monday",
                ],
                [
                  "payout",
                  "Stripe payouts",
                  "When a payout is sent to your bank",
                ],
                ["staffJoin", "Staff joined", "When an invitation is accepted"],
              ] as const
            ).map(([k, l, d], i) => (
              <SourceLabel
                key={k}
                className={`flex cursor-pointer items-center justify-between gap-4 py-4 ${i ? "border-t" : ""}`}
              >
                <span>
                  <span className="block font-medium">
                    <Copy>{l}</Copy>
                  </span>

                  <span className="text-sm text-muted-foreground">
                    <Copy>{d}</Copy>
                  </span>
                </span>

                <SourceInput
                  type="checkbox"
                  className="h-5 w-5 accent-[var(--primary)]"
                  checked={s.notif[k]}
                  onChange={(e) =>
                    update((p) => ({
                      ...p,
                      notif: { ...p.notif, [k]: e.target.checked },
                    }))
                  }
                />
              </SourceLabel>
            ))}
          </Copy>
        </Card>
      )}
    </Copy>
  )
}

"use client"
import { SettingsPanel1 } from "../../panels/panel-1"
import { SettingsPanel2 } from "../../panels/panel-2"
import { SettingsPanel3 } from "../../panels/panel-3"
import { SettingsPanel4 } from "../../panels/panel-4"
import { SettingsPanel5 } from "../../panels/panel-5"
import { SettingsPanel6 } from "../../panels/panel-6"

import { Copy } from "@/components/shared/translated-copy"

import { Link } from "@/components/demo/shared/navigation"
import { Button } from "@/components/ui/lovable-button"
import { Card } from "../shared"
import { useSettingsPageView } from "../context"
export function SettingsPageSection2() {
  const { sec } = useSettingsPageView()

  return (
    <main className="min-w-0 space-y-6">
      <SettingsPanel1 />

      <SettingsPanel2 />

      <Copy>
        {sec === "payments" && (
          <Card
            title="Stripe Connect"
            sub="Payments go straight to your own Stripe account. WhitePlate takes 0% per order."
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border p-5">
              <div>
                <p className="font-display text-lg font-bold">
                  <Copy>Not connected</Copy>
                </p>

                <p className="text-sm text-muted-foreground">
                  <Copy>
                    No verified Stripe account. Payments and payouts are not
                    available in this demo workspace.
                  </Copy>
                </p>
              </div>

              <Button asChild variant="outline">
                <Link to="/dashboard">
                  <Copy>View connection status</Copy>
                </Link>
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-3 border">
              <Copy>
                {[
                  ["WhitePlate fee", "0%"],
                  ["Stripe fee", "By account"],
                  ["Payout", "Unavailable"],
                ].map(([k, v], i) => (
                  <div key={k} className={`p-4 ${i ? "border-l" : ""}`}>
                    <p className="label-mono text-muted-foreground">
                      <Copy>{k}</Copy>
                    </p>

                    <p className="font-display text-2xl font-bold">
                      <Copy>{v}</Copy>
                    </p>
                  </div>
                ))}
              </Copy>
            </div>
          </Card>
        )}
      </Copy>

      <SettingsPanel3 />

      <SettingsPanel4 />

      <SettingsPanel5 />

      <SettingsPanel6 />
    </main>
  )
}

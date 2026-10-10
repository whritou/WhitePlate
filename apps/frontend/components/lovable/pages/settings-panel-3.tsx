"use client"
import { Copy } from "@/components/lovable/copy"
import { SourceButton } from "@/components/ui/lovable-controls"

import { PLANS, Card, Badge } from "./settings-shared"
import { useSettingsPageView } from "./settings-SettingsPage-context"
export function SettingsPanel3() {
  const { s, sec, update, plan, price } = useSettingsPageView()

  return (
    <Copy>
      {sec === "billing" && (
        <>
          <Card
            title="Subscription"
            sub="Switch plan anytime — prorated automatically."
            action={
              <SourceButton
                onClick={() => update((p) => ({ ...p, annual: !p.annual }))}
                className="label-mono border px-3 py-2"
              >
                <Copy>{s.annual ? "Annual · −20%" : "Monthly"}</Copy> ⇄
              </SourceButton>
            }
          >
            <div className="grid gap-3 md:grid-cols-3">
              <Copy>
                {(Object.keys(PLANS) as (keyof typeof PLANS)[]).map((k) => (
                  <SourceButton
                    key={k}
                    onClick={() => update((p) => ({ ...p, plan: k }))}
                    className={`border-2 p-5 text-left ${s.plan === k ? "border-primary bg-secondary" : "border-border hover:border-foreground"}`}
                  >
                    <p className="label-mono text-muted-foreground">
                      <Copy>{s.plan === k ? "Current plan" : "Switch"}</Copy>
                    </p>

                    <p className="font-display text-xl font-bold">
                      <Copy>{PLANS[k].name}</Copy>
                    </p>

                    <p className="font-display text-3xl font-bold">
                      €<Copy>{price(PLANS[k].m)}</Copy>
                      <span className="text-sm text-muted-foreground">
                        <Copy>/mo</Copy>
                      </span>
                    </p>

                    <p className="text-sm text-muted-foreground">
                      <Copy>
                        {PLANS[k].sites === 99
                          ? "Unlimited"
                          : `Up to ${PLANS[k].sites}`}
                      </Copy>{" "}
                      <Copy> restaurants</Copy>
                    </p>
                  </SourceButton>
                ))}
              </Copy>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border p-4 text-sm">
              <span>
                <Copy>Payment method · </Copy>
                <b>
                  <Copy>Visa •••• 4242</Copy>
                </b>{" "}
                <Copy> · exp 08/28</Copy>
              </span>

              <span className="text-muted-foreground">
                <Copy>Next charge €</Copy>
                <Copy>{s.annual ? price(plan.m) * 12 : plan.m}</Copy>{" "}
                <Copy> on </Copy>
                <Copy>{s.annual ? "Jan 1, 2027" : "Nov 1, 2026"}</Copy>
              </span>
            </div>
          </Card>

          <Card title="Invoices">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="label-mono text-left text-muted-foreground">
                  <th className="py-2">
                    <Copy>Invoice</Copy>
                  </th>

                  <th>
                    <Copy>Date</Copy>
                  </th>

                  <th>
                    <Copy>Amount</Copy>
                  </th>

                  <th>
                    <Copy>Status</Copy>
                  </th>

                  <th />
                </tr>
              </thead>

              <tbody>
                <Copy>
                  {["Oct", "Sep", "Aug", "Jul"].map((m, i) => (
                    <tr key={m} className="border-b last:border-0">
                      <td className="py-3 font-medium">
                        <Copy>WP-2026-</Copy>

                        <Copy>{String(10 - i).padStart(4, "0")}</Copy>
                      </td>

                      <td>
                        <Copy>{m}</Copy> 1, 2026
                      </td>

                      <td>
                        €<Copy>{plan.m}</Copy>.00
                      </td>

                      <td>
                        <Badge s="paid" />
                      </td>

                      <td className="text-right">
                        <SourceButton
                          className="label-mono text-primary hover:underline"
                          disabled
                          title="Backend connection required"
                        >
                          <Copy>PDF ↓</Copy>
                        </SourceButton>
                      </td>
                    </tr>
                  ))}
                </Copy>
              </tbody>
            </table>
          </Card>
        </>
      )}
    </Copy>
  )
}

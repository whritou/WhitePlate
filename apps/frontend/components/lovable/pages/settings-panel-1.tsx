"use client"
import { Copy } from "@/components/lovable/copy"
import {
  SourceInput,
  SourceSelect,
  SourceOption,
} from "@/components/ui/lovable-controls"

import { input, Card, Field } from "./settings-shared"
import { useSettingsPageView } from "./settings-SettingsPage-context"
export function SettingsPanel1() {
  const { s, sec, update } = useSettingsPageView()

  return (
    <Copy>
      {sec === "org" && (
        <>
          <Card
            title="Organization profile"
            sub="Shown on receipts, invoices and your storefront legal page."
          >
            <div className="flex items-center gap-4 border-b pb-5">
              <div className="grid h-16 w-16 place-items-center bg-primary font-display text-2xl font-bold text-primary-foreground">
                <Copy>{s.org.name.slice(0, 1)}</Copy>
              </div>

              <div>
                <p className="font-display text-lg font-bold">
                  <Copy>{s.org.name}</Copy>
                </p>

                <p className="label-mono text-muted-foreground">
                  <Copy>Org ID · org_7f3k29</Copy>
                </p>
              </div>
            </div>

            <div className="grid gap-4 pt-5 md:grid-cols-2">
              <Copy>
                {(
                  [
                    ["name", "Organization name"],
                    ["legal", "Legal entity"],
                    ["vat", "VAT number"],
                    ["siret", "Company number (SIRET)"],
                    ["email", "Billing email"],
                    ["address", "Registered address"],
                  ] as const
                ).map(([k, l]) => (
                  <Field key={k} label={l}>
                    <SourceInput
                      className={input}
                      value={s.org[k]}
                      onChange={(e) =>
                        update((p) => ({
                          ...p,
                          org: { ...p.org, [k]: e.target.value },
                        }))
                      }
                    />
                  </Field>
                ))}
              </Copy>
            </div>
          </Card>

          <Card
            title="Regional"
            sub="Applied to all restaurants unless overridden."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Currency">
                <SourceSelect
                  className={input}
                  value={s.org.currency}
                  onChange={(e) =>
                    update((p) => ({
                      ...p,
                      org: { ...p.org, currency: e.target.value },
                    }))
                  }
                >
                  <Copy>
                    {["EUR", "GBP", "CHF", "USD"].map((c) => (
                      <SourceOption key={c}>
                        <Copy>{c}</Copy>
                      </SourceOption>
                    ))}
                  </Copy>
                </SourceSelect>
              </Field>

              <Field label="Timezone">
                <SourceSelect
                  className={input}
                  value={s.org.timezone}
                  onChange={(e) =>
                    update((p) => ({
                      ...p,
                      org: { ...p.org, timezone: e.target.value },
                    }))
                  }
                >
                  <Copy>
                    {[
                      "Europe/Paris",
                      "Europe/London",
                      "Europe/Zurich",
                      "America/New_York",
                    ].map((c) => (
                      <SourceOption key={c}>
                        <Copy>{c}</Copy>
                      </SourceOption>
                    ))}
                  </Copy>
                </SourceSelect>
              </Field>
            </div>
          </Card>
        </>
      )}
    </Copy>
  )
}

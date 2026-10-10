"use client"
import { Copy } from "@/components/lovable/copy"
import { SourceButton, SourceInput } from "@/components/ui/lovable-controls"

import { input, Card, Badge } from "./settings-shared"
import { useSettingsPageView } from "./settings-SettingsPage-context"
export function SettingsPanel4() {
  const { s, sec, newDomain, setNewDomain, persist } = useSettingsPageView()

  return (
    <Copy>
      {sec === "domains" && (
        <Card
          title="Custom domains"
          sub="Example domains only. DNS verification and SSL require a backend connection."
        >
          <div className="mb-4 flex gap-2">
            <SourceInput
              className={input}
              placeholder="order.yourrestaurant.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
            />

            <SourceButton
              className="btn-primary whitespace-nowrap"
              onClick={() => {
                if (!newDomain.trim()) return
                persist(
                  {
                    ...s,
                    domains: [
                      ...s.domains,
                      { host: newDomain.trim(), status: "pending" },
                    ],
                  },
                  "Domain added — add the DNS record"
                )
                setNewDomain("")
              }}
            >
              <Copy>Add domain</Copy>
            </SourceButton>
          </div>

          <div className="grid gap-3">
            <Copy>
              {s.domains.map((d) => (
                <div key={d.host} className="border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <p className="font-display font-bold">
                        <Copy>{d.host}</Copy>
                      </p>

                      <Badge s={d.status} />
                    </div>

                    <div className="flex gap-2">
                      <Copy>
                        {d.status === "pending" && (
                          <SourceButton
                            className="label-mono border px-3 py-2 hover:bg-secondary"
                            disabled
                            title="Backend connection required"
                          >
                            <Copy>Verify</Copy>
                          </SourceButton>
                        )}
                      </Copy>

                      <SourceButton
                        className="label-mono border px-3 py-2 hover:bg-secondary"
                        onClick={() =>
                          persist(
                            {
                              ...s,
                              domains: s.domains.filter(
                                (x) => x.host !== d.host
                              ),
                            },
                            "Domain removed"
                          )
                        }
                      >
                        <Copy>Remove</Copy>
                      </SourceButton>
                    </div>
                  </div>

                  <Copy>
                    {d.status === "pending" && (
                      <div className="mt-3 grid grid-cols-3 border bg-secondary text-sm">
                        <div className="p-2">
                          <p className="label-mono text-muted-foreground">
                            <Copy>Type</Copy>
                          </p>

                          <Copy>CNAME</Copy>
                        </div>

                        <div className="border-l p-2">
                          <p className="label-mono text-muted-foreground">
                            <Copy>Name</Copy>
                          </p>

                          <Copy>{d.host.split(".")[0]}</Copy>
                        </div>

                        <div className="border-l p-2">
                          <p className="label-mono text-muted-foreground">
                            <Copy>Value</Copy>
                          </p>

                          <Copy>stores.whiteplate.app</Copy>
                        </div>
                      </div>
                    )}
                  </Copy>
                </div>
              ))}
            </Copy>
          </div>
        </Card>
      )}
    </Copy>
  )
}

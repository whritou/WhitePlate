"use client"
import { Copy } from "@/components/lovable/copy"
import { SourceButton } from "@/components/ui/lovable-controls"

import { Card, Badge } from "./settings-shared"
import { useSettingsPageView } from "./settings-SettingsPage-context"
export function SettingsPanel2() {
  const { s, sec, setEditing, persist, plan, activeSites } =
    useSettingsPageView()

  return (
    <Copy>
      {sec === "restaurants" && (
        <Card
          title="Restaurants"
          sub={`${activeSites} of ${plan.sites === 99 ? "unlimited" : plan.sites} locations on your ${plan.name} plan.`}
          action={
            <SourceButton
              className="btn-primary"
              onClick={() =>
                setEditing({
                  id: "",
                  name: "",
                  address: "",
                  phone: "",
                  status: "open",
                  prep: 15,
                  hours: "",
                })
              }
            >
              <Copy>+ Add restaurant</Copy>
            </SourceButton>
          }
        >
          <div className="grid gap-3">
            <Copy>
              {s.restaurants.map((r) => (
                <div
                  key={r.id}
                  className={`flex flex-wrap items-center justify-between gap-4 border p-4 ${r.status === "archived" ? "opacity-50" : ""}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-display font-bold">
                        <Copy>{r.name}</Copy>
                      </p>

                      <Badge s={r.status} />
                    </div>

                    <p className="text-sm text-muted-foreground">
                      <Copy>{r.address}</Copy> · <Copy>{r.phone}</Copy>
                    </p>

                    <p className="label-mono text-muted-foreground">
                      <Copy>{r.hours}</Copy> <Copy> · prep </Copy>
                      <Copy>{r.prep}</Copy> <Copy> min</Copy>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Copy>
                      {r.status !== "archived" && (
                        <SourceButton
                          className="label-mono border px-3 py-2 hover:bg-secondary"
                          onClick={() =>
                            persist(
                              {
                                ...s,
                                restaurants: s.restaurants.map((x) =>
                                  x.id === r.id
                                    ? {
                                        ...x,
                                        status:
                                          x.status === "open"
                                            ? "paused"
                                            : "open",
                                      }
                                    : x
                                ),
                              },
                              r.status === "open"
                                ? "Orders paused"
                                : "Accepting orders"
                            )
                          }
                        >
                          <Copy>
                            {r.status === "open" ? "Pause" : "Resume"}
                          </Copy>
                        </SourceButton>
                      )}
                    </Copy>

                    <SourceButton
                      className="label-mono border px-3 py-2 hover:bg-secondary"
                      onClick={() => setEditing(r)}
                    >
                      <Copy>Edit</Copy>
                    </SourceButton>

                    <SourceButton
                      className="label-mono border px-3 py-2 hover:bg-secondary"
                      onClick={() =>
                        persist(
                          {
                            ...s,
                            restaurants: s.restaurants.map((x) =>
                              x.id === r.id
                                ? {
                                    ...x,
                                    status:
                                      x.status === "archived"
                                        ? "paused"
                                        : "archived",
                                  }
                                : x
                            ),
                          },
                          r.status === "archived" ? "Restored" : "Archived"
                        )
                      }
                    >
                      <Copy>
                        {r.status === "archived" ? "Restore" : "Archive"}
                      </Copy>
                    </SourceButton>
                  </div>
                </div>
              ))}
            </Copy>
          </div>
        </Card>
      )}
    </Copy>
  )
}

"use client"
import { SourceModal } from "@/components/ui/lovable-modal"
import { Copy } from "@/components/lovable/copy"
import { SourceButton, SourceInput } from "@/components/ui/lovable-controls"

import { input, Field } from "./settings-shared"
import { useSettingsPageView } from "./settings-SettingsPage-context"
import { SettingsPageSection1 } from "./settings-SettingsPage-section-1"
export function SettingsPageView() {
  const {
    s,
    dirty,
    toast,
    editing,
    setEditing,
    save,
    persist,
    plan,
    activeSites,
  } = useSettingsPageView()

  return (
    <div className="min-h-screen bg-background">
      <section className="flex flex-wrap items-end justify-between gap-6 px-6 pt-8 pb-6">
        <div>
          <p className="label-mono text-muted-foreground">
            <Copy>{s.org.name}</Copy> · <Copy>{activeSites}</Copy>{" "}
            <Copy> restaurants · </Copy>
            <Copy>{plan.name}</Copy> <Copy> plan</Copy>
          </p>

          <h1 className="mt-1 font-display text-4xl font-bold">
            <Copy>Settings</Copy>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Copy>
            {dirty && (
              <span className="label-mono text-muted-foreground">
                <Copy>Unsaved changes</Copy>
              </span>
            )}
          </Copy>

          <SourceButton
            onClick={save}
            disabled={!dirty}
            className="btn-primary disabled:opacity-40"
          >
            <Copy>Save changes</Copy>
          </SourceButton>
        </div>
      </section>

      <SettingsPageSection1 />

      <Copy>
        {editing && (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 p-4"
            onClick={() => setEditing(null)}
          >
            <SourceModal
              label="Edit restaurant"
              onClose={() => setEditing(null)}
              className="w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <form
                className="w-full max-w-lg border-2 border-foreground bg-background p-6"
                onClick={(e) => e.stopPropagation()}
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!editing.name.trim()) return

                  const list = editing.id
                    ? s.restaurants.map((r) =>
                        r.id === editing.id ? editing : r
                      )
                    : [...s.restaurants, { ...editing, id: `r${Date.now()}` }]

                  persist(
                    { ...s, restaurants: list },
                    editing.id ? "Restaurant updated" : "Restaurant added"
                  )
                  setEditing(null)
                }}
              >
                <h2 className="font-display text-2xl font-bold">
                  <Copy>
                    {editing.id ? "Edit restaurant" : "Add restaurant"}
                  </Copy>
                </h2>

                <div className="mt-4 grid gap-3">
                  <Copy>
                    {(
                      [
                        ["name", "Name"],
                        ["address", "Address"],
                        ["phone", "Phone"],
                        ["hours", "Opening hours"],
                      ] as const
                    ).map(([k, l]) => (
                      <Field key={k} label={l}>
                        <SourceInput
                          className={input}
                          value={editing[k]}
                          onChange={(e) =>
                            setEditing({ ...editing, [k]: e.target.value })
                          }
                        />
                      </Field>
                    ))}
                  </Copy>

                  <Field label="Default prep time (min)">
                    <SourceInput
                      type="number"
                      min={1}
                      className={input}
                      value={editing.prep}
                      onChange={(e) =>
                        setEditing({ ...editing, prep: Number(e.target.value) })
                      }
                    />
                  </Field>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <SourceButton
                    type="button"
                    className="label-mono border px-4 py-2"
                    onClick={() => setEditing(null)}
                  >
                    <Copy>Cancel</Copy>
                  </SourceButton>

                  <SourceButton className="btn-primary">
                    <Copy>Save</Copy>
                  </SourceButton>
                </div>
              </form>
            </SourceModal>
          </div>
        )}
      </Copy>

      <Copy>
        {toast && (
          <div className="label-mono fixed bottom-6 left-1/2 z-50 -translate-x-1/2 bg-foreground px-4 py-3 text-background">
            <Copy>{toast}</Copy>
          </div>
        )}
      </Copy>
    </div>
  )
}

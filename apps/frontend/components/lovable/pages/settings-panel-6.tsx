"use client"
import { Copy } from "@/components/lovable/copy"
import { SourceButton, SourceInput } from "@/components/ui/lovable-controls"

import { input, Card } from "./settings-shared"
import { useSettingsPageView } from "./settings-SettingsPage-context"
export function SettingsPanel6() {
  const { s, sec, confirmDelete, setConfirmDelete, flash } =
    useSettingsPageView()

  return (
    <Copy>
      {sec === "danger" && (
        <Card
          title="Danger zone"
          sub="These actions affect every restaurant in the organization."
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border p-4">
            <div>
              <p className="font-bold">
                <Copy>Transfer ownership</Copy>
              </p>

              <p className="text-sm text-muted-foreground">
                <Copy>Make another admin the organization owner.</Copy>
              </p>
            </div>

            <SourceButton
              className="label-mono border px-3 py-2 hover:bg-secondary"
              disabled
              title="Backend connection required"
            >
              <Copy>Transfer</Copy>
            </SourceButton>
          </div>

          <div className="mt-3 border-2 border-destructive p-4">
            <p className="font-bold text-destructive">
              <Copy>Delete organization</Copy>
            </p>

            <p className="text-sm text-muted-foreground">
              <Copy>
                Removes all restaurants, menus, orders and staff. Type{" "}
              </Copy>
              <b>
                <Copy>{s.org.name}</Copy>
              </b>{" "}
              <Copy> to confirm.</Copy>
            </p>

            <div className="mt-3 flex gap-2">
              <SourceInput
                className={input}
                value={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.value)}
                placeholder={s.org.name}
              />

              <SourceButton
                disabled={confirmDelete !== s.org.name}
                className="label-mono bg-destructive px-4 whitespace-nowrap text-destructive-foreground disabled:opacity-40"
                onClick={() => {
                  setConfirmDelete("")
                  flash("Demo only — nothing deleted")
                }}
              >
                <Copy>Delete</Copy>
              </SourceButton>
            </div>
          </div>
        </Card>
      )}
    </Copy>
  )
}

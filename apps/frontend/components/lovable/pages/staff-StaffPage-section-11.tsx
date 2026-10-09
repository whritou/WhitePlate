"use client"
import { Copy } from "@/components/lovable/copy"
import { SourceButton, SourceInput } from "@/components/ui/lovable-controls"

import { PERMS, uid } from "./staff-shared"
import { useStaffPageView } from "./staff-StaffPage-context"
export function StaffPageSection11() {
  const { s, setConfirm, update, flash } = useStaffPageView()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <Copy>Tick what each role can do. Owner always has full access.</Copy>
        </p>

        <SourceButton
          onClick={() =>
            update((d) => {
              d.roles.push({
                id: uid(),
                name: "New role",
                perms: ["orders"],
              })
            }, "created a new role")
          }
          className="btn-ghost py-2"
        >
          <Copy>+ Custom role</Copy>
        </SourceButton>
      </div>

      <div className="overflow-x-auto border">
        <table className="w-full text-sm">
          <thead className="border-b bg-secondary">
            <tr>
              <th className="label-mono px-4 py-3 text-left text-muted-foreground">
                <Copy>Permission</Copy>
              </th>

              <Copy>
                {s.roles.map((r) => (
                  <th key={r.id} className="px-2 py-2 text-center">
                    <Copy>
                      {r.system ? (
                        <span className="font-display font-bold">
                          <Copy>{r.name}</Copy>
                        </span>
                      ) : (
                        <SourceInput
                          value={r.name}
                          onChange={(e) =>
                            update((d) => {
                              d.roles.find((x) => x.id === r.id)!.name =
                                e.target.value
                            })
                          }
                          className="w-28 border bg-background px-2 py-1 text-center font-display font-bold"
                          aria-label="Role name"
                        />
                      )}
                    </Copy>

                    <p className="label-mono mt-1 text-muted-foreground">
                      <Copy>
                        {s.members.filter((m) => m.role === r.id).length}
                      </Copy>{" "}
                      <Copy> members</Copy>
                    </p>
                  </th>
                ))}
              </Copy>
            </tr>
          </thead>

          <tbody>
            <Copy>
              {PERMS.map(([p, label]) => (
                <tr key={p} className="border-b last:border-0">
                  <td className="px-4 py-3 font-semibold">
                    <Copy>{label}</Copy>
                  </td>

                  <Copy>
                    {s.roles.map((r) => {
                      const on = r.perms.includes(p)

                      return (
                        <td key={r.id} className="text-center">
                          <SourceButton
                            disabled={r.system}
                            aria-label={`${label} for ${r.name}`}
                            onClick={() =>
                              update((d) => {
                                const x = d.roles.find((y) => y.id === r.id)!

                                x.perms = on
                                  ? x.perms.filter((y) => y !== p)
                                  : [...x.perms, p]
                              })
                            }
                            className={`h-7 w-7 border font-bold ${on ? "bg-primary text-primary-foreground" : "bg-background"} ${r.system ? "cursor-not-allowed opacity-70" : "hover:shadow-[2px_2px_0_0_var(--color-primary)]"}`}
                          >
                            <Copy>{on ? "✓" : ""}</Copy>
                          </SourceButton>
                        </td>
                      )
                    })}
                  </Copy>
                </tr>
              ))}
            </Copy>

            <tr>
              <td />

              <Copy>
                {s.roles.map((r) => (
                  <td key={r.id} className="py-2 text-center">
                    <Copy>
                      {!r.system && (
                        <SourceButton
                          onClick={() => {
                            const used =
                              s.members.some((m) => m.role === r.id) ||
                              s.invites.some((i) => i.role === r.id)

                            if (used)
                              return flash(
                                "Reassign its members before deleting this role"
                              )
                            setConfirm({
                              text: `Delete the role "${r.name}"?`,
                              action: () =>
                                update((d) => {
                                  d.roles = d.roles.filter((x) => x.id !== r.id)
                                }, `deleted the role ${r.name}`),
                            })
                          }}
                          className="label-mono text-destructive"
                        >
                          <Copy>Delete</Copy>
                        </SourceButton>
                      )}
                    </Copy>
                  </td>
                ))}
              </Copy>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

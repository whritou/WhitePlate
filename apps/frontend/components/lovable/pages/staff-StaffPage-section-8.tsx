"use client"
import { Copy } from "@/components/lovable/copy"
import {
  SourceButton,
  SourceSelect,
  SourceOption,
} from "@/components/ui/lovable-controls"

import { RESTAURANTS } from "./staff-shared"
import { useStaffPageView } from "./staff-StaffPage-context"
export function StaffPageSection8() {
  const { s, setEditing, setConfirm, update, flash, roleName, members } =
    useStaffPageView()

  return (
    <>
      {members.map((m) => (
        <tr
          key={m.id}
          className={`border-b last:border-0 ${m.status === "suspended" ? "opacity-60" : ""}`}
        >
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center bg-primary font-bold text-primary-foreground">
                <Copy>
                  {m.name
                    .split(" ")
                    .map((x) => x[0])
                    .join("")}
                </Copy>
              </span>

              <div>
                <p className="font-semibold">
                  <Copy>{m.name}</Copy>{" "}
                  <Copy>
                    {m.owner && (
                      <span className="label-mono ml-1 bg-accent px-1.5">
                        <Copy>You</Copy>
                      </span>
                    )}
                  </Copy>
                </p>

                <p className="text-xs text-muted-foreground">
                  <Copy>{m.email}</Copy>
                </p>
              </div>
            </div>
          </td>

          <td className="px-4">
            <Copy>
              {m.owner ? (
                <span className="label-mono border px-2 py-1">
                  <Copy>Owner</Copy>
                </span>
              ) : (
                <SourceSelect
                  value={m.role}
                  aria-label={`Role for ${m.name}`}
                  className="label-mono border bg-background px-2 py-1"
                  onChange={(e) => {
                    const r = e.target.value

                    update(
                      (d) => {
                        d.members.find((x) => x.id === m.id)!.role = r
                      },
                      `changed ${m.name}'s role to ${roleName(r)}`
                    )
                    flash("Role updated")
                  }}
                >
                  <Copy>
                    {s.roles
                      .filter((r) => r.id !== "owner")
                      .map((r) => (
                        <SourceOption key={r.id} value={r.id}>
                          <Copy>{r.name}</Copy>
                        </SourceOption>
                      ))}
                  </Copy>
                </SourceSelect>
              )}
            </Copy>
          </td>

          <td className="px-4 text-muted-foreground">
            <Copy>
              {m.restaurants.length === RESTAURANTS.length
                ? "All restaurants"
                : m.restaurants.map((r) => r.split(" — ")[1]).join(", ")}
            </Copy>
          </td>

          <td className="px-4 text-muted-foreground">
            <Copy>{m.lastActive}</Copy>
          </td>

          <td className="px-4">
            <span
              className={`label-mono px-2 py-0.5 ${m.status === "active" ? "bg-accent" : "border text-destructive"}`}
            >
              <Copy>{m.status}</Copy>
            </span>
          </td>

          <td className="px-4 text-right whitespace-nowrap">
            <Copy>
              {!m.owner && (
                <div className="flex justify-end gap-1">
                  <SourceButton
                    onClick={() => setEditing(m)}
                    className="label-mono border px-2 py-1 hover:bg-secondary"
                  >
                    <Copy>Edit</Copy>
                  </SourceButton>

                  <SourceButton
                    onClick={() => {
                      const next =
                        m.status === "active" ? "suspended" : "active"

                      update(
                        (d) => {
                          d.members.find((x) => x.id === m.id)!.status = next
                        },
                        `${next === "active" ? "reactivated" : "suspended"} ${m.name}`
                      )
                      flash(
                        next === "active"
                          ? "Access restored"
                          : "Member suspended"
                      )
                    }}
                    className="label-mono border px-2 py-1 hover:bg-secondary"
                  >
                    <Copy>
                      {m.status === "active" ? "Suspend" : "Reactivate"}
                    </Copy>
                  </SourceButton>

                  <SourceButton
                    onClick={() =>
                      setConfirm({
                        text: `Revoke all access for ${m.name}? They will be signed out immediately.`,
                        action: () => {
                          update((d) => {
                            d.members = d.members.filter((x) => x.id !== m.id)
                          }, `revoked access for ${m.name}`)
                          flash("Access revoked")
                        },
                      })
                    }
                    className="label-mono border px-2 py-1 text-destructive hover:bg-secondary"
                  >
                    <Copy>Revoke</Copy>
                  </SourceButton>
                </div>
              )}
            </Copy>
          </td>
        </tr>
      ))}
    </>
  )
}

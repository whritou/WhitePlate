"use client"
import { Copy } from "@/components/lovable/copy"
import { SourceButton } from "@/components/ui/lovable-controls"

import { useStaffPageView } from "./staff-StaffPage-context"
import { StaffPageSection2 } from "./staff-StaffPage-section-2"
import { StaffPageSection9 } from "./staff-StaffPage-section-9"
export function StaffPageSection1() {
  const { s, tab, update, flash, roleName } = useStaffPageView()

  return (
    <main className="p-6">
      <StaffPageSection2 />

      <Copy>
        {tab === "invites" && (
          <div className="space-y-2">
            <Copy>
              {s.invites.length === 0 && (
                <p className="label-mono border border-dashed p-10 text-center text-muted-foreground">
                  <Copy>No pending invitations</Copy>
                </p>
              )}
            </Copy>

            <Copy>
              {s.invites.map((i) => (
                <div
                  key={i.id}
                  className="flex flex-wrap items-center gap-4 border p-4"
                >
                  <span className="flex h-9 w-9 items-center justify-center border border-dashed text-muted-foreground">
                    ✉
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      <Copy>{i.email}</Copy>
                    </p>

                    <p className="text-xs text-muted-foreground">
                      <Copy>{roleName(i.role)}</Copy> ·{" "}
                      <Copy>
                        {i.restaurants.map((r) => r.split(" — ")[1]).join(", ")}
                      </Copy>{" "}
                      <Copy> · sent </Copy>
                      <Copy>{i.sent}</Copy> <Copy> · expires </Copy>
                      <Copy>{i.expires}</Copy>
                    </p>
                  </div>

                  <SourceButton
                    disabled
                    title="Backend connection required"
                    className="label-mono border px-2 py-1 hover:bg-secondary"
                  >
                    <Copy>Copy link</Copy>
                  </SourceButton>

                  <SourceButton
                    onClick={() => {
                      update((d) => {
                        const x = d.invites.find((y) => y.id === i.id)!

                        x.sent = "just now"
                        x.expires = "in 7 days"
                      }, `resent the invitation to ${i.email}`)
                      flash("Demo invitation updated; no email was sent")
                    }}
                    className="label-mono border px-2 py-1 hover:bg-secondary"
                  >
                    <Copy>Resend</Copy>
                  </SourceButton>

                  <SourceButton
                    onClick={() => {
                      update((d) => {
                        d.invites = d.invites.filter((y) => y.id !== i.id)
                      }, `cancelled the invitation to ${i.email}`)
                      flash("Invitation cancelled")
                    }}
                    className="label-mono border px-2 py-1 text-destructive hover:bg-secondary"
                  >
                    <Copy>Cancel</Copy>
                  </SourceButton>
                </div>
              ))}
            </Copy>
          </div>
        )}
      </Copy>

      <StaffPageSection9 />

      <Copy>
        {tab === "activity" && (
          <ul className="max-w-2xl border">
            <Copy>
              {s.log.map((l, i) => (
                <li
                  key={i}
                  className="flex gap-4 border-b px-4 py-3 last:border-0"
                >
                  <span className="label-mono w-36 shrink-0 text-muted-foreground">
                    <Copy>{l.at}</Copy>
                  </span>

                  <span className="text-sm">
                    <Copy>{l.text}</Copy>
                  </span>
                </li>
              ))}
            </Copy>
          </ul>
        )}
      </Copy>
    </main>
  )
}

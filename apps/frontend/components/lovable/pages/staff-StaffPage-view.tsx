"use client"
import { SourceModal } from "@/components/ui/lovable-modal"
import { Copy } from "@/components/lovable/copy"
import { SourceButton } from "@/components/ui/lovable-controls"

import { RESTAURANTS, uid, MemberModal } from "./staff-shared"
import { useStaffPageView } from "./staff-StaffPage-context"
import { StaffPageSection1 } from "./staff-StaffPage-section-1"
export function StaffPageView() {
  const {
    s,
    tab,
    setTab,
    inviting,
    setInviting,
    editing,
    setEditing,
    confirm,
    setConfirm,
    toast,
    update,
    flash,
    roleName,
  } = useStaffPageView()

  return (
    <div className="min-h-screen bg-background">
      <section className="flex flex-wrap items-end justify-between gap-6 px-6 pt-8 pb-6">
        <div>
          <p className="label-mono text-muted-foreground">
            <Copy>Groupe Maison Verte · </Copy>
            <Copy>{RESTAURANTS.length}</Copy> <Copy> restaurants</Copy>
          </p>

          <h1 className="mt-1 font-display text-4xl font-bold">
            <Copy>Staff & roles</Copy>
          </h1>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="grid max-w-full grid-cols-3 border">
            <Copy>
              {[
                [
                  "Members",
                  s.members.filter((m) => m.status === "active").length,
                ],
                ["Pending", s.invites.length],
                ["Roles", s.roles.length],
              ].map(([k, v], i) => (
                <div
                  key={k}
                  className={`px-3 py-3 sm:px-5 ${i ? "border-l" : ""}`}
                >
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

          <SourceButton
            onClick={() => setInviting(true)}
            className="btn-primary"
          >
            <Copy>+ Invite member</Copy>
          </SourceButton>
        </div>
      </section>

      <nav className="flex overflow-x-auto border-b px-6">
        <Copy>
          {(
            [
              ["members", "Members"],
              ["invites", `Invitations (${s.invites.length})`],
              ["roles", "Roles & permissions"],
              ["activity", "Activity"],
            ] as const
          ).map(([k, l]) => (
            <SourceButton
              key={k}
              onClick={() => setTab(k)}
              className={`label-mono border-b-2 px-4 py-3 ${tab === k ? "border-primary" : "border-transparent text-muted-foreground"}`}
            >
              <Copy>{l}</Copy>
            </SourceButton>
          ))}
        </Copy>
      </nav>

      <StaffPageSection1 />

      <Copy>
        {inviting && (
          <MemberModal
            title="Invite a team member"
            roles={s.roles}
            submit="Send invitation"
            onClose={() => setInviting(false)}
            onSave={({ email, role, restaurants }) => {
              if (
                s.members.some((m) => m.email === email) ||
                s.invites.some((i) => i.email === email)
              )
                return "This email is already on your team"
              update(
                (d) => {
                  d.invites.unshift({
                    id: uid(),
                    email,
                    role,
                    restaurants,
                    sent: "just now",
                    expires: "in 7 days",
                  })
                },
                `invited ${email} as ${roleName(role)}`
              )
              setInviting(false)
              setTab("invites")
              flash(`Demo invitation saved for ${email}; no email was sent`)

              return null
            }}
          />
        )}
      </Copy>

      <Copy>
        {editing && (
          <MemberModal
            title={`Edit ${editing.name}`}
            roles={s.roles}
            submit="Save changes"
            initial={editing}
            onClose={() => setEditing(null)}
            onSave={({ role, restaurants }) => {
              update((d) => {
                const x = d.members.find((y) => y.id === editing.id)!

                x.role = role
                x.restaurants = restaurants
              }, `updated ${editing.name}'s access`)
              setEditing(null)
              flash("Access updated")

              return null
            }}
          />
        )}
      </Copy>

      <Copy>
        {confirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4"
            onClick={() => setConfirm(null)}
          >
            <SourceModal
              label="Confirm action"
              onClose={() => setConfirm(null)}
              onClick={(e) => e.stopPropagation()}
              className="card-hard w-full max-w-sm space-y-4 bg-background p-5"
            >
              <p className="font-display text-lg font-bold">
                <Copy>Are you sure?</Copy>
              </p>

              <p className="text-sm text-muted-foreground">
                <Copy>{confirm.text}</Copy>
              </p>

              <div className="flex justify-end gap-2">
                <SourceButton
                  onClick={() => setConfirm(null)}
                  className="btn-ghost py-2"
                >
                  <Copy>Cancel</Copy>
                </SourceButton>

                <SourceButton
                  onClick={() => {
                    confirm.action()
                    setConfirm(null)
                  }}
                  className="btn-primary py-2"
                >
                  <Copy>Confirm</Copy>
                </SourceButton>
              </div>
            </SourceModal>
          </div>
        )}
      </Copy>

      <Copy>
        {toast && (
          <div className="card-hard fixed right-6 bottom-6 z-50 bg-ink px-4 py-3 text-sm font-semibold text-ink-foreground">
            <Copy>{toast}</Copy>
          </div>
        )}
      </Copy>
    </div>
  )
}

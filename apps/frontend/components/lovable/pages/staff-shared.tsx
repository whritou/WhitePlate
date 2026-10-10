"use client"
import { SourceModal } from "@/components/ui/lovable-modal"
import { Copy } from "@/components/lovable/copy"
import {
  SourceButton,
  SourceInput,
  SourceLabel,
} from "@/components/ui/lovable-controls"
import type { Perm, Role, Member, State } from "@/types/lovable/page-staff"
import { useState } from "react"
export type {
  Perm,
  Role,
  Member,
  Invite,
  Log,
  State,
} from "@/types/lovable/page-staff"
export const RESTAURANTS = [
  "Maison Verte — Bastille",
  "Burger Maison — Oberkampf",
  "Maison Verte — Batignolles",
]
export const PERMS = [
  ["orders", "View & manage orders"],
  ["kitchen", "Kitchen display"],
  ["menu", "Edit menu & prices"],
  ["discounts", "Discount codes"],
  ["analytics", "Analytics & revenue"],
  ["studio", "Storefront design"],
  ["staff", "Invite & manage staff"],
  ["billing", "Billing & payouts"],
] as const
export const ALL: Perm[] = PERMS.map((p) => p[0])
export const SEED: State = {
  roles: [
    { id: "owner", name: "Owner", perms: ALL, system: true },
    {
      id: "manager",
      name: "Manager",
      perms: [
        "orders",
        "kitchen",
        "menu",
        "discounts",
        "analytics",
        "studio",
        "staff",
      ],
    },
    { id: "staff", name: "Staff", perms: ["orders", "kitchen"] },
    { id: "kitchen", name: "Kitchen", perms: ["kitchen"] },
    { id: "accountant", name: "Accountant", perms: ["analytics", "billing"] },
  ],
  members: [
    {
      id: "m1",
      name: "Arthur Thomas",
      email: "arthur@maisonverte.fr",
      role: "owner",
      restaurants: RESTAURANTS,
      lastActive: "Now",
      status: "active",
      owner: true,
    },
    {
      id: "m2",
      name: "Camille Durand",
      email: "camille@maisonverte.fr",
      role: "manager",
      restaurants: [RESTAURANTS[0]!, RESTAURANTS[2]!],
      lastActive: "12 min ago",
      status: "active",
    },
    {
      id: "m3",
      name: "Yanis Benali",
      email: "yanis@maisonverte.fr",
      role: "kitchen",
      restaurants: [RESTAURANTS[0]!],
      lastActive: "1 h ago",
      status: "active",
    },
    {
      id: "m4",
      name: "Sofia Rossi",
      email: "sofia@burgermaison.fr",
      role: "manager",
      restaurants: [RESTAURANTS[1]!],
      lastActive: "Yesterday",
      status: "active",
    },
    {
      id: "m5",
      name: "Lucas Martin",
      email: "lucas@maisonverte.fr",
      role: "staff",
      restaurants: [RESTAURANTS[0]!],
      lastActive: "3 days ago",
      status: "active",
    },
    {
      id: "m6",
      name: "Nadia Haddad",
      email: "nadia@compta-paris.fr",
      role: "accountant",
      restaurants: RESTAURANTS,
      lastActive: "2 weeks ago",
      status: "suspended",
    },
  ],
  invites: [
    {
      id: "i1",
      email: "hugo.serveur@gmail.com",
      role: "staff",
      restaurants: [RESTAURANTS[1]!],
      sent: "2 days ago",
      expires: "in 5 days",
    },
    {
      id: "i2",
      email: "chef.lea@gmail.com",
      role: "kitchen",
      restaurants: [RESTAURANTS[2]!],
      sent: "6 days ago",
      expires: "tomorrow",
    },
  ],
  log: [
    {
      at: "Yesterday 18:02",
      text: "Camille Durand invited hugo.serveur@gmail.com as Staff",
    },
    { at: "2 weeks ago", text: "Arthur Thomas suspended Nadia Haddad" },
  ],
}
export const KEY = "whiteplate-lovable-demo-staff"
export const uid = () => Math.random().toString(36).slice(2, 9)
export const now = () =>
  new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
export const input =
  "w-full border bg-background px-3 py-2 text-sm outline-none focus:shadow-[3px_3px_0_0_var(--color-primary)]"
export function MemberModal({
  title,
  roles,
  submit,
  initial,
  onClose,
  onSave,
}: {
  title: string
  roles: Role[]
  submit: string
  initial?: Member
  onClose: () => void
  onSave: (v: {
    email: string
    role: string
    restaurants: string[]
  }) => string | null
}) {
  const [email, setEmail] = useState(initial?.email ?? "")
  const [role, setRole] = useState(initial?.role ?? "staff")
  const [restaurants, setRestaurants] = useState<string[]>(
    initial?.restaurants ?? [RESTAURANTS[0]!]
  )
  const [err, setErr] = useState("")
  const perms = roles.find((r) => r.id === role)?.perms ?? []
  const valid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && restaurants.length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4"
      onClick={onClose}
    >
      <SourceModal
        label="Invite staff"
        onClose={() => onClose()}
        onClick={(e) => e.stopPropagation()}
        className="card-hard w-full max-w-lg bg-background"
      >
        <div className="flex items-center justify-between border-b px-5 py-3">
          <p className="font-display text-lg font-bold">
            <Copy>{title}</Copy>
          </p>

          <SourceButton onClick={onClose} aria-label="Close">
            ✕
          </SourceButton>
        </div>

        <div className="space-y-4 p-5">
          <SourceLabel className="block space-y-1.5">
            <span className="text-sm font-semibold">
              <Copy>Email</Copy>
            </span>

            <SourceInput
              type="email"
              value={email}
              disabled={!!initial}
              onChange={(e) => {
                setEmail(e.target.value.trim())
                setErr("")
              }}
              placeholder="name@restaurant.com"
              className={`${input} disabled:opacity-60`}
            />
          </SourceLabel>

          <div className="space-y-1.5">
            <span className="text-sm font-semibold">
              <Copy>Role</Copy>
            </span>

            <div className="grid grid-cols-2 gap-2">
              <Copy>
                {roles
                  .filter((r) => r.id !== "owner")
                  .map((r) => (
                    <SourceButton
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className={`border px-3 py-2 text-left text-sm ${role === r.id ? "bg-foreground text-background" : "hover:bg-secondary"}`}
                    >
                      <b>
                        <Copy>{r.name}</Copy>
                      </b>

                      <span className="block text-xs opacity-70">
                        <Copy>{r.perms.length}</Copy> <Copy> permissions</Copy>
                      </span>
                    </SourceButton>
                  ))}
              </Copy>
            </div>

            <p className="text-xs text-muted-foreground">
              <Copy>Can: </Copy>

              <Copy>
                {PERMS.filter(([p]) => perms.includes(p))
                  .map(([, l]) => l.toLowerCase())
                  .join(", ") || "nothing yet"}
              </Copy>
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="text-sm font-semibold">
              <Copy>Restaurants</Copy>
            </span>

            <Copy>
              {RESTAURANTS.map((r) => (
                <SourceLabel
                  key={r}
                  className="flex items-center gap-2 border px-3 py-2 text-sm"
                >
                  <SourceInput
                    type="checkbox"
                    checked={restaurants.includes(r)}
                    onChange={() =>
                      setRestaurants((x) =>
                        x.includes(r) ? x.filter((y) => y !== r) : [...x, r]
                      )
                    }
                    className="accent-[var(--color-primary)]"
                  />

                  <Copy>{r}</Copy>
                </SourceLabel>
              ))}
            </Copy>
          </div>

          <Copy>
            {err && (
              <p className="text-sm font-semibold text-destructive">
                <Copy>{err}</Copy>
              </p>
            )}
          </Copy>

          <SourceButton
            disabled={!valid}
            onClick={() => {
              const e = onSave({ email, role, restaurants })

              if (e) setErr(e)
            }}
            className="btn-primary w-full justify-center disabled:opacity-40"
          >
            <Copy>{submit}</Copy>
          </SourceButton>
        </div>
      </SourceModal>
    </div>
  )
}

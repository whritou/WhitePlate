"use client"
import { useDemoDraft } from "@/hooks/lovable/use-demo-draft"
import type { Member, State } from "@/types/lovable/page-staff"
import { useState } from "react"
import { SEED, KEY, now } from "./staff-shared"
export function useStaffPageModel() {
  const [s, setS] = useDemoDraft<State>(SEED, () => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "null") ?? SEED
    } catch {
      return SEED
    }
  })
  const [tab, setTab] = useState<"members" | "invites" | "roles" | "activity">(
    "members"
  )
  const [q, setQ] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [inviting, setInviting] = useState(false)
  const [editing, setEditing] = useState<Member | null>(null)
  const [confirm, setConfirm] = useState<{
    text: string
    action: () => void
  } | null>(null)
  const [toast, setToast] = useState("")

  const update = (fn: (d: State) => void, msg?: string) =>
    setS((cur) => {
      const d = structuredClone(cur)

      fn(d)
      if (msg) d.log.unshift({ at: now(), text: `Arthur Thomas ${msg}` })
      localStorage.setItem(KEY, JSON.stringify(d))

      return d
    })
  const flash = (t: string) => {
    setToast(t)
    setTimeout(() => setToast(""), 2200)
  }

  const roleName = (id: string) => s.roles.find((r) => r.id === id)?.name ?? id
  const members = s.members.filter(
    (m) =>
      (roleFilter === "all" || m.role === roleFilter) &&
      `${m.name} ${m.email}`.toLowerCase().includes(q.toLowerCase())
  )

  return {
    s,
    setS,
    tab,
    setTab,
    q,
    setQ,
    roleFilter,
    setRoleFilter,
    inviting,
    setInviting,
    editing,
    setEditing,
    confirm,
    setConfirm,
    toast,
    setToast,
    update,
    flash,
    roleName,
    members,
  }
}

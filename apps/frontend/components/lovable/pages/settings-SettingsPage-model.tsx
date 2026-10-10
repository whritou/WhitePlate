"use client"
import { useDemoDraft } from "@/hooks/lovable/use-demo-draft"
import { useSearchParams } from "next/navigation"
import type { Restaurant, State, Section } from "@/types/lovable/page-settings"
import { useState } from "react"
import { KEY, DEFAULT, PLANS } from "./settings-shared"
export function useSettingsPageModel(storageKey = KEY) {
  const { section } = Object.fromEntries(useSearchParams().entries())
  const [s, setS] = useDemoDraft<State>(DEFAULT, () => {
    try {
      return {
        ...DEFAULT,
        ...JSON.parse(localStorage.getItem(storageKey) || "null"),
      }
    } catch {
      return DEFAULT
    }
  })
  const [sec, setSec] = useState<Section>(
    [
      "org",
      "restaurants",
      "payments",
      "billing",
      "domains",
      "notifications",
      "danger",
    ].includes(section)
      ? (section as Section)
      : "org"
  )
  const [dirty, setDirty] = useState(false)
  const [toast, setToast] = useState("")
  const [editing, setEditing] = useState<Restaurant | null>(null)
  const [newDomain, setNewDomain] = useState("")
  const [confirmDelete, setConfirmDelete] = useState("")

  const flash = (t: string) => {
    setToast(t)
    setTimeout(() => setToast(""), 2200)
  }

  const update = (fn: (p: State) => State) => {
    setS(fn)
    setDirty(true)
  }

  const save = () => {
    localStorage.setItem(storageKey, JSON.stringify(s))
    setDirty(false)
    flash("Settings saved")
  }

  const persist = (next: State, msg: string) => {
    setS(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
    flash(msg)
  }

  const plan = PLANS[s.plan]
  const price = (m: number) => (s.annual ? Math.round(m * 0.8) : m)
  const activeSites = s.restaurants.filter(
    (r) => r.status !== "archived"
  ).length

  return {
    section,
    s,
    setS,
    sec,
    setSec,
    dirty,
    setDirty,
    toast,
    setToast,
    editing,
    setEditing,
    newDomain,
    setNewDomain,
    confirmDelete,
    setConfirmDelete,
    flash,
    update,
    save,
    persist,
    plan,
    price,
    activeSites,
  }
}

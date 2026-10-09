"use client"
import { useDemoDraft } from "@/hooks/lovable/use-demo-draft"
import { SourceInput, SourceTextarea } from "@/components/ui/lovable-controls"
import type { Tab, Translatable } from "@/types/lovable/page-menu"
import { useState } from "react"
import {
  DEFAULT_MENU,
  loadMenu,
  saveMenu,
  type MenuData,
  type Product,
} from "@/lib/lovable/menu"
import { uid, input } from "./menu-shared"
export function useMenuPageModel() {
  const [m, setM] = useDemoDraft<MenuData>(DEFAULT_MENU, loadMenu)
  const [tab, setTab] = useState<Tab>("dishes")
  const [lang, setLang] = useState("en")
  const [catId, setCatId] = useState<string>("")
  const [selId, setSelId] = useState<string | null>(null)
  const [saved, setSaved] = useState(true)
  const [query, setQuery] = useState("")
  const [drag, setDrag] = useState<{ kind: "cat" | "item"; id: string } | null>(
    null
  )

  const base = m.languages[0] ?? "en"
  const update = (fn: (d: MenuData) => void) => {
    setM((cur) => {
      const d = structuredClone(cur)

      fn(d)

      return d
    })
    setSaved(false)
  }

  const txt = (o: Translatable, f: string) =>
    lang === base ? String(o[f] ?? "") : (o.tr?.[lang]?.[f] ?? "")
  const setTxt = (
    locate: (d: MenuData) => Translatable | undefined,
    f: string,
    v: string
  ) =>
    update((d) => {
      const o = locate(d)

      if (!o) return
      if (lang === base) o[f] = v
      else {
        o.tr ??= {}
        o.tr[lang] ??= {}
        o.tr[lang]![f] = v
      }
    })
  const T = ({
    o,
    f,
    at,
    cls,
    area,
  }: {
    o: Translatable
    f: string
    at: (d: MenuData) => Translatable | undefined
    cls?: string
    area?: boolean
  }) => {
    const props = {
      value: txt(o, f),
      placeholder: lang === base ? "" : String(o[f] ?? ""),
      onChange: (e: { target: { value: string } }) =>
        setTxt(at, f, e.target.value),
      className: cls ?? input,
    }

    return area ? (
      <SourceTextarea rows={2} {...props} />
    ) : (
      <SourceInput {...props} />
    )
  }

  const cat = m.categories.find((c) => c.id === catId) ?? m.categories[0]
  const findItem = (d: MenuData, id: string | null) =>
    d.categories.flatMap((c) => c.items).find((i) => i.id === id)
  const item = findItem(m, selId) ?? null
  const patch = (p: Partial<Product>) =>
    update((d) => {
      const i = findItem(d, selId)

      if (i) Object.assign(i, p)
    })
  const addCategory = () => {
    const id = uid()

    update((d) => {
      d.categories.push({ id, cat: "New category", items: [] })
    })
    setCatId(id)
    setSelId(null)
  }

  const addItem = () => {
    if (!cat) return

    const id = uid()

    update((d) => {
      d.categories
        .find((c) => c.id === cat.id)
        ?.items.push({
          id,
          n: "New dish",
          d: "",
          p: 10,
          images: [],
          options: [],
          tax: 10,
          available: true,
          allergens: [],
        })
    })
    setSelId(id)
  }

  const del = (id: string) => {
    update((d) =>
      d.categories.forEach(
        (c) => (c.items = c.items.filter((i) => i.id !== id))
      )
    )
    if (selId === id) setSelId(null)
  }

  const dup = (p: Product) =>
    update((d) => {
      const c = d.categories.find((x) => x.id === cat?.id)

      if (c)
        c.items.splice(c.items.findIndex((x) => x.id === p.id) + 1, 0, {
          ...structuredClone(p),
          id: uid(),
          n: p.n + " (copy)",
        })
    })
  const onDrop = (kind: "cat" | "item", targetId: string) => {
    if (!drag || drag.kind !== kind || drag.id === targetId)
      return setDrag(null)
    update((d) => {
      if (kind === "cat") {
        const from = d.categories.findIndex((c) => c.id === drag.id),
          to = d.categories.findIndex((c) => c.id === targetId)
        const [x] = d.categories.splice(from, 1)

        d.categories.splice(to, 0, x!)
      } else {
        const c = d.categories.find((x) => x.id === cat?.id)

        if (!c) return

        const from = c.items.findIndex((i) => i.id === drag.id),
          to = c.items.findIndex((i) => i.id === targetId)
        const [x] = c.items.splice(from, 1)

        c.items.splice(to, 0, x!)
      }
    })
    setDrag(null)
  }

  const dropItemOnCat = (targetCat: string) => {
    if (drag?.kind !== "item") return false
    update((d) => {
      const src = d.categories.find((c) =>
        c.items.some((i) => i.id === drag.id)
      )
      const dst = d.categories.find((c) => c.id === targetCat)

      if (!src || !dst || src === dst) return

      const [x] = src.items.splice(
        src.items.findIndex((i) => i.id === drag.id),
        1
      )

      dst.items.push(x!)
    })
    setDrag(null)

    return true
  }

  const publish = () => {
    if (saveMenu(m)) setSaved(true)
    else alert("Photos are too large to save. Try smaller image files.")
  }

  const all = m.categories.flatMap((c) => c.items)
  const items = (cat?.items ?? []).filter((i) =>
    i.n.toLowerCase().includes(query.toLowerCase())
  )

  return {
    m,
    setM,
    tab,
    setTab,
    lang,
    setLang,
    catId,
    setCatId,
    selId,
    setSelId,
    saved,
    setSaved,
    query,
    setQuery,
    drag,
    setDrag,
    base,
    update,
    txt,
    setTxt,
    T,
    cat,
    findItem,
    item,
    patch,
    addCategory,
    addItem,
    del,
    dup,
    onDrop,
    dropItemOnCat,
    publish,
    all,
    items,
  }
}

"use client"
import { Copy } from "@/components/lovable/copy"
import {
  SourceButton,
  SourceInput,
  SourceLabel,
} from "@/components/ui/lovable-controls"
import type { Translatable } from "@/types/lovable/page-menu"
import { useState } from "react"
import { type MenuData } from "@/lib/lovable/menu"
export type { Tab, Translatable } from "@/types/lovable/page-menu"
export const TAXES = [5.5, 10, 20]
export const TAGS = ["", "Veggie", "Vegan", "Bestseller", "Spicy", "New"]
export const uid = () => Math.random().toString(36).slice(2, 9)
export const input =
  "w-full border bg-background px-3 py-2 text-sm outline-none focus:shadow-[3px_3px_0_0_var(--color-primary)]"
export function countMissing(m: MenuData, lang: string) {
  let n = 0
  const chk = (o: Translatable, f: string) => {
    if (String(o[f] ?? "").trim() && !o.tr?.[lang]?.[f]) n++
  }

  m.categories.forEach((c) => {
    chk(c, "cat")
    c.items.forEach((i) => {
      chk(i, "n")
      chk(i, "d")
      i.options.forEach((o) => {
        chk(o, "group")
        o.choices.forEach((ch) => chk(ch, "n"))
      })
    })
  })
  m.allergens.forEach((a) => chk(a, "name"))

  return n
}

export function Images({
  images,
  onChange,
}: {
  images: string[]
  onChange: (v: string[]) => void
}) {
  const [dragI, setDragI] = useState<number | null>(null)
  const addFiles = (files: FileList | null) => {
    if (!files) return
    Promise.all(
      [...files].map(
        (f) =>
          new Promise<string>((res) => {
            const r = new FileReader()

            r.onload = () => res(String(r.result))
            r.readAsDataURL(f)
          })
      )
    ).then((urls) => onChange([...images, ...urls]))
  }

  return (
    <div className="space-y-1.5">
      <span className="text-sm font-semibold">
        <Copy>Photos · drag to reorder, first is the cover</Copy>
      </span>

      <div className="grid grid-cols-3 gap-2">
        <Copy>
          {images.map((src, i) => (
            <div
              key={i}
              draggable
              onDragStart={() => setDragI(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragI === null || dragI === i) return

                const n = [...images]
                const [x] = n.splice(dragI, 1)

                n.splice(i, 0, x!)
                onChange(n)
                setDragI(null)
              }}
              className={`group relative aspect-square cursor-grab overflow-hidden border ${dragI === i ? "opacity-40" : ""}`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />

              <Copy>
                {i === 0 && (
                  <span className="label-mono absolute top-1 left-1 bg-accent px-1">
                    <Copy>Cover</Copy>
                  </span>
                )}
              </Copy>

              <SourceButton
                onClick={() => onChange(images.filter((_, k) => k !== i))}
                className="absolute top-1 right-1 bg-foreground px-1.5 text-xs text-background opacity-0 group-hover:opacity-100"
                aria-label="Remove photo"
              >
                ✕
              </SourceButton>
            </div>
          ))}
        </Copy>

        <SourceLabel className="label-mono flex aspect-square cursor-pointer items-center justify-center border border-dashed text-center text-muted-foreground hover:bg-secondary">
          <Copy>+ Add</Copy>

          <br />

          <Copy>photos</Copy>

          <SourceInput
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </SourceLabel>
      </div>
    </div>
  )
}

export function F({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <SourceLabel className="block space-y-1.5">
      <span className="text-sm font-semibold">
        <Copy>{label}</Copy>
      </span>

      <Copy>{children}</Copy>
    </SourceLabel>
  )
}

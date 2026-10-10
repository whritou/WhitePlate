"use client"
import { Copy } from "@/components/lovable/copy"
import { SourceButton } from "@/components/ui/lovable-controls"
import { useMenuPageView } from "./menu-MenuPage-context"
import { MenuPageSection4 } from "./menu-MenuPage-section-4"
import { MenuPageSection7 } from "./menu-MenuPage-section-7"
export function MenuPageSection3() {
  const {
    m,
    setCatId,
    setSelId,
    setDrag,
    txt,
    cat,
    addCategory,
    onDrop,
    dropItemOnCat,
  } = useMenuPageView()

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-r lg:w-60">
        <p className="label-mono border-b px-4 py-3 text-muted-foreground">
          <Copy>Categories · drag to reorder</Copy>
        </p>

        <ul className="flex-1 overflow-y-auto">
          {m.categories.map((c) => (
            <li
              key={c.id}
              draggable
              onDragStart={() => setDrag({ kind: "cat", id: c.id })}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (!dropItemOnCat(c.id)) onDrop("cat", c.id)
              }}
            >
              <SourceButton
                onClick={() => {
                  setCatId(c.id)
                  setSelId(null)
                }}
                className={`flex w-full items-center justify-between border-b px-4 py-3 text-left ${c.id === cat?.id ? "bg-accent font-bold" : "hover:bg-secondary"}`}
              >
                <span className="flex items-center gap-2">
                  <span className="cursor-grab text-muted-foreground">⋮⋮</span>

                  <Copy>
                    {txt(c, "cat") || (
                      <i className="text-muted-foreground">
                        <Copy>{c.cat}</Copy>
                      </i>
                    )}
                  </Copy>
                </span>

                <span className="label-mono">
                  <Copy>{c.items.length}</Copy>
                </span>
              </SourceButton>
            </li>
          ))}
        </ul>

        <SourceButton
          onClick={addCategory}
          className="label-mono border-t px-4 py-3 text-left hover:bg-secondary"
        >
          <Copy>+ Add category</Copy>
        </SourceButton>
      </aside>

      <MenuPageSection4 />

      <MenuPageSection7 />
    </div>
  )
}

"use client"
import { Copy } from "@/components/lovable/copy"
import { SourceButton, SourceInput } from "@/components/ui/lovable-controls"
import { input } from "./menu-shared"
import { useMenuPageView } from "./menu-MenuPage-context"
export function MenuPageSection6() {
  const {
    m,
    setCatId,
    selId,
    setSelId,
    query,
    setQuery,
    drag,
    setDrag,
    update,
    txt,
    T,
    cat,
    findItem,
    addCategory,
    addItem,
    del,
    dup,
    onDrop,
    items,
  } = useMenuPageView()

  return (
    <>
      {cat ? (
        <>
          <div className="flex flex-wrap items-center gap-3 border-b px-6 py-4">
            <Copy>
              {T({
                o: cat,
                f: "cat",
                at: (d) => d.categories.find((c) => c.id === cat.id),
                cls: "min-w-[200px] flex-1 bg-transparent font-display text-2xl font-bold outline-none",
              })}
            </Copy>

            <SourceInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes…"
              className={`${input} w-44`}
            />

            <SourceButton
              onClick={() => {
                if (confirm(`Delete "${cat.cat}" and its dishes?`)) {
                  update((d) => {
                    d.categories = d.categories.filter((c) => c.id !== cat.id)
                  })
                  setCatId("")
                  setSelId(null)
                }
              }}
              className="label-mono border px-3 py-2 text-destructive hover:bg-secondary"
            >
              <Copy>Delete</Copy>
            </SourceButton>

            <SourceButton onClick={addItem} className="btn-primary py-2">
              <Copy>+ Add dish</Copy>
            </SourceButton>
          </div>

          <p className="label-mono px-6 pt-3 text-muted-foreground">
            <Copy>Drag dishes to reorder · drop on a category to move</Copy>
          </p>

          <div className="flex-1 space-y-2 overflow-y-auto p-6 pt-3">
            <Copy>
              {items.length === 0 && (
                <p className="label-mono border border-dashed p-10 text-center text-muted-foreground">
                  <Copy>No dishes yet — add your first one</Copy>
                </p>
              )}
            </Copy>

            {items.map((i) => (
              <div
                key={i.id}
                draggable
                onDragStart={() => setDrag({ kind: "item", id: i.id })}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop("item", i.id)}
                onClick={() => setSelId(i.id)}
                className={`flex cursor-pointer items-center gap-4 border bg-background p-3 transition-shadow ${selId === i.id ? "shadow-[4px_4px_0_0_var(--color-primary)]" : ""} ${drag?.id === i.id ? "opacity-40" : ""} ${i.available === false ? "opacity-60" : ""}`}
              >
                <span className="cursor-grab text-muted-foreground">⋮⋮</span>

                <div className="relative h-14 w-14 shrink-0 overflow-hidden border bg-secondary">
                  <Copy>
                    {i.images[0] ? (
                      <img
                        src={i.images[0]}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="label-mono flex h-full items-center justify-center text-muted-foreground">
                        <Copy>No img</Copy>
                      </span>
                    )}
                  </Copy>

                  <Copy>
                    {i.images.length > 1 && (
                      <span className="label-mono absolute right-0 bottom-0 bg-foreground px-1 text-background">
                        <Copy>{i.images.length}</Copy>
                      </span>
                    )}
                  </Copy>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">
                    <Copy>
                      {txt(i, "n") || (
                        <i className="text-destructive">
                          <Copy>Missing translation · </Copy>

                          <Copy>{i.n}</Copy>
                        </i>
                      )}
                    </Copy>{" "}
                    <Copy>
                      {i.tag && (
                        <span className="label-mono ml-1 bg-accent px-1.5 py-0.5">
                          <Copy>{i.tag}</Copy>
                        </span>
                      )}
                    </Copy>
                  </p>

                  <p className="truncate text-sm text-muted-foreground">
                    {txt(i, "d") || "—"}
                  </p>

                  <p className="mt-1 text-sm">
                    <Copy>
                      {(i.allergens ?? [])
                        .map((a) => m.allergens.find((x) => x.id === a)?.icon)
                        .join(" ") || (
                        <span className="label-mono text-muted-foreground">
                          <Copy>No allergens</Copy>
                        </span>
                      )}
                    </Copy>
                  </p>
                </div>

                <p className="font-display text-lg font-bold">
                  €<Copy>{i.p.toFixed(2)}</Copy>
                </p>

                <SourceButton
                  onClick={(e) => {
                    e.stopPropagation()
                    update((d) => {
                      const x = findItem(d, i.id)

                      if (x) x.available = x.available === false
                    })
                  }}
                  className={`label-mono w-24 border px-2 py-1.5 ${i.available === false ? "text-destructive" : "bg-primary text-primary-foreground"}`}
                >
                  <Copy>
                    {i.available === false ? "Sold out" : "Available"}
                  </Copy>
                </SourceButton>

                <SourceButton
                  onClick={(e) => {
                    e.stopPropagation()
                    dup(i)
                  }}
                  className="label-mono px-2 text-muted-foreground hover:text-foreground"
                >
                  <Copy>Copy</Copy>
                </SourceButton>

                <SourceButton
                  onClick={(e) => {
                    e.stopPropagation()
                    del(i.id)
                  }}
                  className="label-mono px-2 text-destructive"
                  aria-label="Delete dish"
                >
                  ✕
                </SourceButton>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <SourceButton onClick={addCategory} className="btn-primary">
            <Copy>+ Create your first category</Copy>
          </SourceButton>
        </div>
      )}
    </>
  )
}

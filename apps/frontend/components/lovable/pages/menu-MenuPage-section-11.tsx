"use client"
import { Copy } from "@/components/lovable/copy"
import {
  SourceButton,
  SourceInput,
  SourceSelect,
  SourceOption,
} from "@/components/ui/lovable-controls"
import { TAXES, TAGS, input, Images, F } from "./menu-shared"
import { useMenuPageView } from "./menu-MenuPage-context"
import { MenuPageSection12 } from "./menu-MenuPage-section-12"
export function MenuPageSection11() {
  const { m, setTab, lang, update, T, findItem, item, patch } =
    useMenuPageView()

  if (!item) return null

  return (
    <div className="space-y-5 p-5">
      <Images images={item.images} onChange={(images) => patch({ images })} />

      <F label="Name">
        <Copy>
          {T({
            o: item,
            f: "n",
            at: (d) => findItem(d, item.id),
          })}
        </Copy>
      </F>

      <F label="Description">
        <Copy>
          {T({
            o: item,
            f: "d",
            at: (d) => findItem(d, item.id),
            area: true,
          })}
        </Copy>
      </F>

      <F label="Category">
        <SourceSelect
          value={
            m.categories.find((c) => c.items.some((x) => x.id === item.id))?.id
          }
          className={input}
          onChange={(e) =>
            update((d) => {
              const src = d.categories.find((c) =>
                c.items.some((x) => x.id === item.id)
              )
              const dst = d.categories.find((c) => c.id === e.target.value)

              if (!src || !dst || src === dst) return

              const [x] = src.items.splice(
                src.items.findIndex((i) => i.id === item.id),
                1
              )

              dst.items.push(x!)
            })
          }
        >
          <Copy>
            {m.categories.map((c) => (
              <SourceOption key={c.id} value={c.id}>
                <Copy>{c.cat}</Copy>
              </SourceOption>
            ))}
          </Copy>
        </SourceSelect>
      </F>

      <div className="grid grid-cols-2 gap-3">
        <F label="Price (incl. VAT)">
          <SourceInput
            type="number"
            step="0.5"
            min="0"
            value={item.p}
            onChange={(e) => patch({ p: Math.max(0, +e.target.value) })}
            className={input}
          />
        </F>

        <F label="VAT rate">
          <SourceSelect
            value={item.tax ?? 10}
            onChange={(e) => patch({ tax: +e.target.value })}
            className={input}
          >
            <Copy>
              {TAXES.map((x) => (
                <SourceOption key={x} value={x}>
                  <Copy>{x}</Copy>%
                </SourceOption>
              ))}
            </Copy>
          </SourceSelect>
        </F>
      </div>

      <F label="Tag">
        <div className="flex flex-wrap gap-1.5">
          <Copy>
            {TAGS.map((t) => (
              <SourceButton
                key={t || "none"}
                onClick={() => patch({ tag: t })}
                className={`label-mono border px-2 py-1 ${(item.tag ?? "") === t ? "bg-accent" : ""}`}
              >
                <Copy>{t || "None"}</Copy>
              </SourceButton>
            ))}
          </Copy>
        </div>
      </F>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">
            <Copy>Allergens</Copy>
          </span>

          <SourceButton
            onClick={() => setTab("allergens")}
            className="label-mono text-primary"
          >
            <Copy>Edit list</Copy>
          </SourceButton>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Copy>
            {m.allergens.map((a) => {
              const on = item.allergens?.includes(a.id)

              return (
                <SourceButton
                  key={a.id}
                  onClick={() =>
                    patch({
                      allergens: on
                        ? item.allergens!.filter((x) => x !== a.id)
                        : [...(item.allergens ?? []), a.id],
                    })
                  }
                  className={`border px-2 py-1 text-sm ${on ? "bg-foreground text-background" : ""}`}
                >
                  <Copy>{a.icon}</Copy>{" "}
                  <Copy>{a.tr?.[lang]?.["name"] || a.name}</Copy>
                </SourceButton>
              )
            })}
          </Copy>
        </div>
      </div>

      <MenuPageSection12 />
    </div>
  )
}

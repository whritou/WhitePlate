"use client"
import { Copy } from "@/components/lovable/copy"
import {
  SourceButton,
  SourceInput,
  SourceSelect,
  SourceOption,
} from "@/components/ui/lovable-controls"
import { type MenuData, type Option } from "@/lib/lovable/menu"
import { useMenuPageView } from "./menu-MenuPage-context"
export function MenuPageSection12() {
  const { update, T, findItem, item, patch } = useMenuPageView()

  if (!item) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">
          <Copy>Options & extras</Copy>
        </p>

        <SourceButton
          onClick={() =>
            patch({
              options: [
                ...item.options,
                {
                  group: "New group",
                  type: "one",
                  choices: [{ n: "Choice", p: 0 }],
                },
              ],
            })
          }
          className="label-mono text-primary"
        >
          <Copy>+ Group</Copy>
        </SourceButton>
      </div>

      <Copy>
        {item.options.map((o, gi) => {
          const og = (d: MenuData) => findItem(d, item.id)?.options[gi]
          const setO = (fn: (o: Option) => void) =>
            update((d) => {
              const x = og(d)

              if (x) fn(x)
            })

          return (
            <div key={gi} className="border">
              <div className="flex items-center gap-2 border-b bg-secondary p-2">
                <Copy>
                  {T({
                    o: o,
                    f: "group",
                    at: og,
                    cls: "min-w-0 flex-1 bg-transparent text-sm font-bold outline-none",
                  })}
                </Copy>

                <SourceSelect
                  value={o.type}
                  onChange={(e) =>
                    setO((x) => {
                      x.type = e.target.value as Option["type"]
                    })
                  }
                  className="label-mono border bg-background px-1 py-1"
                >
                  <SourceOption value="one">
                    <Copy>Pick 1</Copy>
                  </SourceOption>

                  <SourceOption value="many">
                    <Copy>Multiple</Copy>
                  </SourceOption>
                </SourceSelect>

                <SourceButton
                  onClick={() =>
                    patch({
                      options: item.options.filter((_, i) => i !== gi),
                    })
                  }
                  className="text-destructive"
                  aria-label="Delete group"
                >
                  ✕
                </SourceButton>
              </div>

              <div className="space-y-1 p-2">
                <Copy>
                  {o.choices.map((c, ci) => (
                    <div key={ci} className="flex items-center gap-2">
                      <Copy>
                        {T({
                          o: c,
                          f: "n",
                          at: (d) => og(d)?.choices[ci],
                          cls: "min-w-0 flex-1 border bg-background px-2 py-1 text-sm",
                        })}
                      </Copy>

                      <span className="text-sm text-muted-foreground">+€</span>

                      <SourceInput
                        type="number"
                        step="0.5"
                        min="0"
                        value={c.p}
                        onChange={(e) =>
                          setO((x) => {
                            x.choices[ci]!.p = Math.max(0, +e.target.value)
                          })
                        }
                        className="w-16 border bg-background px-2 py-1 text-sm"
                      />

                      <SourceButton
                        onClick={() =>
                          setO((x) => {
                            x.choices.splice(ci, 1)
                          })
                        }
                        className="text-sm text-muted-foreground"
                        aria-label="Delete choice"
                      >
                        ✕
                      </SourceButton>
                    </div>
                  ))}
                </Copy>

                <SourceButton
                  onClick={() =>
                    setO((x) => {
                      x.choices.push({ n: "", p: 0 })
                    })
                  }
                  className="label-mono pt-1 text-primary"
                >
                  <Copy>+ Choice</Copy>
                </SourceButton>
              </div>
            </div>
          )
        })}
      </Copy>
    </div>
  )
}

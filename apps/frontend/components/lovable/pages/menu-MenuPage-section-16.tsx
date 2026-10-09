"use client"
import { Copy } from "@/components/lovable/copy"
import {
  SourceButton,
  SourceInput,
  SourceSelect,
  SourceOption,
} from "@/components/ui/lovable-controls"
import { uid, input } from "./menu-shared"
import { useMenuPageView } from "./menu-MenuPage-context"
export function MenuPageSection16() {
  const { m, update } = useMenuPageView()

  return (
    <div className="mx-auto max-w-4xl space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">
            <Copy>Discount codes</Copy>
          </h2>

          <p className="text-sm text-muted-foreground">
            <Copy>Customers enter these in the basket.</Copy>
          </p>
        </div>

        <SourceButton
          onClick={() =>
            update((d) => {
              d.discounts.push({
                id: uid(),
                code: "NEWCODE",
                type: "percent",
                value: 10,
                min: 0,
                expires: "",
                active: true,
              })
            })
          }
          className="btn-primary py-2"
        >
          <Copy>+ Code</Copy>
        </SourceButton>
      </div>

      <div className="label-mono grid grid-cols-[1.4fr_1fr_.8fr_.8fr_1.2fr_.8fr_auto] gap-2 px-3 text-muted-foreground">
        <span>
          <Copy>Code</Copy>
        </span>

        <span>
          <Copy>Type</Copy>
        </span>

        <span>
          <Copy>Value</Copy>
        </span>

        <span>
          <Copy>Min order €</Copy>
        </span>

        <span>
          <Copy>Expires</Copy>
        </span>

        <span>
          <Copy>Status</Copy>
        </span>

        <span />
      </div>

      <Copy>
        {m.discounts.map((c) => {
          const set = (p: Partial<typeof c>) =>
            update((d) => {
              const x = d.discounts.find((y) => y.id === c.id)

              if (x) Object.assign(x, p)
            })
          const expired =
            c.expires && new Date(c.expires + "T23:59:59") < new Date()

          return (
            <div
              key={c.id}
              className={`grid grid-cols-[1.4fr_1fr_.8fr_.8fr_1.2fr_.8fr_auto] items-center gap-2 border p-3 ${!c.active || expired ? "opacity-60" : ""}`}
            >
              <SourceInput
                value={c.code}
                onChange={(e) =>
                  set({
                    code: e.target.value.toUpperCase().replace(/\s/g, ""),
                  })
                }
                className={`${input} font-bold`}
              />

              <SourceSelect
                value={c.type}
                onChange={(e) =>
                  set({ type: e.target.value as "percent" | "fixed" })
                }
                className={input}
              >
                <SourceOption value="percent">
                  <Copy>% off</Copy>
                </SourceOption>

                <SourceOption value="fixed">
                  <Copy>€ off</Copy>
                </SourceOption>
              </SourceSelect>

              <SourceInput
                type="number"
                min="0"
                value={c.value}
                onChange={(e) => set({ value: Math.max(0, +e.target.value) })}
                className={input}
              />

              <SourceInput
                type="number"
                min="0"
                value={c.min}
                onChange={(e) => set({ min: Math.max(0, +e.target.value) })}
                className={input}
              />

              <SourceInput
                type="date"
                value={c.expires}
                onChange={(e) => set({ expires: e.target.value })}
                className={input}
              />

              <SourceButton
                onClick={() => set({ active: !c.active })}
                className={`label-mono border px-2 py-2 ${expired ? "text-destructive" : c.active ? "bg-primary text-primary-foreground" : ""}`}
              >
                <Copy>
                  {expired ? "Expired" : c.active ? "Active" : "Paused"}
                </Copy>
              </SourceButton>

              <SourceButton
                onClick={() =>
                  update((d) => {
                    d.discounts = d.discounts.filter((y) => y.id !== c.id)
                  })
                }
                className="label-mono px-2 text-destructive"
                aria-label="Delete code"
              >
                ✕
              </SourceButton>
            </div>
          )
        })}
      </Copy>
    </div>
  )
}

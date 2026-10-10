"use client"
import { Copy } from "@/components/lovable/copy"
import { SourceButton } from "@/components/ui/lovable-controls"
import { SECTIONS } from "./settings-shared"
import { useSettingsPageView } from "./settings-SettingsPage-context"
import { SettingsPageSection2 } from "./settings-SettingsPage-section-2"
export function SettingsPageSection1() {
  const { sec, setSec } = useSettingsPageView()

  return (
    <div className="grid gap-6 px-6 pb-12 lg:grid-cols-[240px_1fr]">
      <aside className="h-fit border lg:sticky lg:top-6">
        <Copy>
          {SECTIONS.map(([k, l, d], i) => (
            <SourceButton
              key={k}
              onClick={() => setSec(k)}
              className={`block w-full px-4 py-3 text-left ${i ? "border-t" : ""} ${sec === k ? "bg-foreground text-background" : "hover:bg-secondary"}`}
            >
              <span
                className={`block font-display font-bold ${k === "danger" && sec !== k ? "text-destructive" : ""}`}
              >
                <Copy>{l}</Copy>
              </span>

              <span
                className={`label-mono ${sec === k ? "opacity-70" : "text-muted-foreground"}`}
              >
                <Copy>{d}</Copy>
              </span>
            </SourceButton>
          ))}
        </Copy>
      </aside>

      <SettingsPageSection2 />
    </div>
  )
}

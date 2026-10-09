"use client"
import { Copy } from "@/components/lovable/copy"
import { Button } from "@/components/ui/lovable-button"
import { useStudioPageView } from "./studio-StudioPage-context"
import { StudioPageSection3 } from "./studio-StudioPage-section-3"
export function StudioPageSection2() {
  const { panel, setPanel } = useStudioPageView()

  return (
    <aside className="max-h-[45vh] w-full shrink-0 space-y-7 overflow-y-auto border-r p-5 sm:max-h-none sm:w-72 lg:w-80">
      <div className="flex border" role="tablist" aria-label="Studio settings">
        <Copy>
          {(["design", "brand"] as const).map((p) => (
            <Button
              key={p}
              role="tab"
              aria-selected={panel === p}
              variant={panel === p ? "secondary" : "ghost"}
              onClick={() => setPanel(p)}
              className="flex-1 capitalize"
            >
              <Copy>{p === "brand" ? "Brand & details" : "Design"}</Copy>
            </Button>
          ))}
        </Copy>
      </div>

      <StudioPageSection3 />
    </aside>
  )
}

"use client"
import { Copy } from "@/components/lovable/copy"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/lovable-button"
import { DnsModal } from "./studio-shared"
import { useStudioPageView } from "./studio-StudioPage-context"
import { StudioPageSection1 } from "./studio-StudioPage-section-1"
export function StudioPageView() {
  const live = useTranslations("LiveWorkspace")
  const {
    isLive,
    t,
    device,
    setDevice,
    page,
    setPage,
    saved,
    dnsOpen,
    setDnsOpen,
    set,
    publish,
  } = useStudioPageView()

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3">
        <h1 className="font-display text-xl font-bold">
          <Copy>Theming studio</Copy>
        </h1>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className="flex max-w-full flex-wrap border"
            role="tablist"
            aria-label="Customer page preview"
          >
            <Copy>
              {(["store", "checkout", "tracking"] as const).map((p) => (
                <Button
                  key={p}
                  role="tab"
                  aria-selected={page === p}
                  variant={page === p ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setPage(p)}
                  className="capitalize"
                >
                  <Copy>{p === "tracking" ? "Order tracking" : p}</Copy>
                </Button>
              ))}
            </Copy>
          </div>

          <div className="flex max-w-full flex-wrap border">
            <Copy>
              {(["desktop", "mobile"] as const).map((d) => (
                <Button
                  key={d}
                  variant={device === d ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setDevice(d)}
                >
                  <Copy>{d}</Copy>
                </Button>
              ))}
            </Copy>
          </div>

          <Button onClick={publish}>
            {isLive ? (
              saved ? (
                live("draftSaved")
              ) : (
                live("saveDraft")
              )
            ) : (
              <Copy>{saved ? "Saved in this browser ✓" : "Save demo"}</Copy>
            )}
          </Button>
        </div>
      </div>

      <StudioPageSection1 />

      <Copy>
        {dnsOpen && (
          <DnsModal
            t={t}
            onClose={() => setDnsOpen(false)}
            onSave={(domain, domainStatus) => set({ domain, domainStatus })}
          />
        )}
      </Copy>
    </div>
  )
}

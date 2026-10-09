"use client"
import { Copy } from "@/components/lovable/copy"
import { ArrowRight, ListOrdered } from "lucide-react"

export function OrderPreview() {
  return (
    <div className="overflow-hidden border bg-background">
      <div className="flex items-center justify-between gap-3 border-b bg-muted px-5 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <ListOrdered size={16} />

          <Copy>Service board</Copy>
        </span>

        <span className="text-xs text-muted-foreground">
          <Copy>Kitchen workflow</Copy>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4">
        <Copy>
          {[
            {
              title: "New",
              id: "#1044",
              customer: "Sarah K.",
              detail: "2 × Burger Maison",
              color: "bg-accent text-accent-foreground",
            },
            {
              title: "Preparing",
              id: "#1039",
              customer: "Inès D.",
              detail: "1 × Green bowl",
              color: "bg-primary text-primary-foreground",
            },
            {
              title: "Ready",
              id: "#1035",
              customer: "Alex M.",
              detail: "1 × Burrata",
              color: "bg-ink text-ink-foreground",
            },
            {
              title: "Collected",
              id: "#1032",
              customer: "Louis R.",
              detail: "2 × Lunch menu",
              color: "bg-muted text-foreground",
            },
          ].map((c) => (
            <div key={c.title} className="min-w-0">
              <p className={`px-3 py-2 text-xs font-semibold ${c.color}`}>
                <Copy>{c.title}</Copy>
              </p>

              <div className="mt-2 border p-3">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span>
                    <Copy>{c.id}</Copy>
                  </span>

                  <span className="text-xs font-normal text-muted-foreground">
                    12:45
                  </span>
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  <Copy>{c.customer}</Copy>
                </p>

                <p className="mt-3 text-xs">
                  <Copy>{c.detail}</Copy>
                </p>
              </div>
            </div>
          ))}
        </Copy>
      </div>

      <div className="flex items-center justify-between border-t px-5 py-3 text-xs">
        <span className="text-muted-foreground">
          <Copy>New → Preparing → Ready → Collected</Copy>
        </span>

        <ArrowRight size={14} />
      </div>
    </div>
  )
}

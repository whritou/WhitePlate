import { notFound } from "next/navigation"
import { EstablishmentFixture } from "./fixture"
import type { SearchParams } from "@/types/navigation"
import { VisualScopeProvider } from "@/components/ui/visual-scope"

export default async function EstablishmentDesignTest({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  if (process.env.NODE_ENV === "production") notFound()

  const params = await searchParams

  return (
    <VisualScopeProvider value={{ className: "lovable-surface lovable-live" }}>
      <div className="lovable-surface lovable-live min-h-screen">
        <EstablishmentFixture
          mode={typeof params.mode === "string" ? params.mode : "success"}
        />
      </div>
    </VisualScopeProvider>
  )
}

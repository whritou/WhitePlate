"use client"
import { Copy } from "@/components/lovable/copy"
import {
  SourceInput,
  SourceSelect,
  SourceOption,
} from "@/components/ui/lovable-controls"
import { input } from "./staff-shared"
import { useStaffPageView } from "./staff-StaffPage-context"
import { StaffPageSection4 } from "./staff-StaffPage-section-4"
export function StaffPageSection3() {
  const { s, tab, q, setQ, roleFilter, setRoleFilter } = useStaffPageView()

  return (
    <>
      {tab === "members" && (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <SourceInput
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or email…"
              className={`${input} w-72`}
            />

            <SourceSelect
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="label-mono border bg-background px-3"
              aria-label="Filter by role"
            >
              <SourceOption value="all">
                <Copy>All roles</Copy>
              </SourceOption>

              <Copy>
                {s.roles.map((r) => (
                  <SourceOption key={r.id} value={r.id}>
                    <Copy>{r.name}</Copy>
                  </SourceOption>
                ))}
              </Copy>
            </SourceSelect>
          </div>

          <StaffPageSection4 />
        </>
      )}
    </>
  )
}

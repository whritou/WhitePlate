"use client"
import { Copy } from "@/components/shared/translated-copy"

import { StaffPageSection6 } from "./section-06"
export function StaffPageSection5() {
  return (
    <table className="w-full text-sm">
      <thead className="border-b bg-secondary">
        <tr className="label-mono text-left text-muted-foreground">
          <th className="px-4 py-3">
            <Copy>Member</Copy>
          </th>

          <th className="px-4">
            <Copy>Role</Copy>
          </th>

          <th className="px-4">
            <Copy>Restaurants</Copy>
          </th>

          <th className="px-4">
            <Copy>Last active</Copy>
          </th>

          <th className="px-4">
            <Copy>Status</Copy>
          </th>

          <th className="px-4 text-right">
            <Copy>Actions</Copy>
          </th>
        </tr>
      </thead>

      <StaffPageSection6 />
    </table>
  )
}

"use client"
import { Copy } from "@/components/lovable/copy"
import { useStaffPageView } from "./staff-StaffPage-context"
import { StaffPageSection7 } from "./staff-StaffPage-section-7"
export function StaffPageSection6() {
  const { members } = useStaffPageView()

  return (
    <tbody>
      <StaffPageSection7 />

      <Copy>
        {members.length === 0 && (
          <tr>
            <td
              colSpan={6}
              className="label-mono p-10 text-center text-muted-foreground"
            >
              <Copy>No members found</Copy>
            </td>
          </tr>
        )}
      </Copy>
    </tbody>
  )
}

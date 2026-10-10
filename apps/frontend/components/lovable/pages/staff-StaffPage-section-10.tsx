"use client"
import { useStaffPageView } from "./staff-StaffPage-context"
import { StaffPageSection11 } from "./staff-StaffPage-section-11"
export function StaffPageSection10() {
  const { tab } = useStaffPageView()

  return <>{tab === "roles" && <StaffPageSection11 />}</>
}

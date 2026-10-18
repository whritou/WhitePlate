"use client"
import { useStaffPageView } from "../context"
import { StaffPageSection11 } from "./section-11"
export function StaffPageSection10() {
  const { tab } = useStaffPageView()

  return <>{tab === "roles" && <StaffPageSection11 />}</>
}

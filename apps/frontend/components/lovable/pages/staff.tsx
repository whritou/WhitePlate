"use client"
import { useStaffPageModel } from "./staff-StaffPage-model"
import { StaffPageProvider } from "./staff-StaffPage-context"
import { StaffPageView } from "./staff-StaffPage-view"
export function StaffPage() {
  const model = useStaffPageModel()

  return (
    <StaffPageProvider model={model}>
      <StaffPageView />
    </StaffPageProvider>
  )
}

export {
  RESTAURANTS,
  PERMS,
  ALL,
  SEED,
  KEY,
  uid,
  now,
  input,
  MemberModal,
} from "./staff-shared"

"use client"
import { useStaffPageModel } from "./model"
import { StaffPageProvider } from "./context"
import { StaffPageView } from "./view"
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
} from "../../../workspace/team/roles/preview-shared"

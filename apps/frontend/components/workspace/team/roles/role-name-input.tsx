"use client"

import type { Dispatch, SetStateAction } from "react"
import { Input } from "@/components/ui/input"
import type { OrganizationRoleGrant } from "@/types/organization"

export function RoleNameInput({
  role,
  name,
  ariaLabel,
  disabled,
  setGrants,
  onEdit,
}: {
  role: OrganizationRoleGrant["role"]
  name: string
  ariaLabel: string
  disabled: boolean
  setGrants: Dispatch<SetStateAction<OrganizationRoleGrant[]>>
  onEdit: () => void
}) {
  return (
    <Input
      aria-label={ariaLabel}
      value={name}
      maxLength={60}
      disabled={disabled}
      onChange={(event) => {
        setGrants((current) =>
          current.map((item) =>
            item.role === role ? { ...item, name: event.target.value } : item
          )
        )
        onEdit()
      }}
      className="px-3"
    />
  )
}

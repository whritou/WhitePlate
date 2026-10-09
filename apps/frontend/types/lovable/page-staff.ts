export type Perm =
  | "orders"
  | "kitchen"
  | "menu"
  | "discounts"
  | "analytics"
  | "studio"
  | "staff"
  | "billing"
export type Role = { id: string; name: string; perms: Perm[]; system?: boolean }
export type Member = {
  id: string
  name: string
  email: string
  role: string
  restaurants: string[]
  lastActive: string
  status: "active" | "suspended"
  owner?: boolean
}
export type Invite = {
  id: string
  email: string
  role: string
  restaurants: string[]
  sent: string
  expires: string
}
export type Log = { at: string; text: string }
export type State = {
  roles: Role[]
  members: Member[]
  invites: Invite[]
  log: Log[]
}

"use client"
import { UserRound } from "lucide-react"
import { Button } from "@/components/ui/lovable-button"
import { Link } from "./navigation"
import { Copy } from "./copy"

export function AccountControl() {
  return (
    <Button asChild variant="ghost" size="sm">
      <Link to="/auth">
        <UserRound />

        <Copy>Log in</Copy>
      </Link>
    </Button>
  )
}

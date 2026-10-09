"use client"
import { Copy } from "@/components/lovable/copy"
import { Link } from "@/components/lovable/navigation"

export function LandingSection11() {
  return (
    <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-6 py-10">
      <Link to="/" className="text-xl font-bold">
        <Copy>White</Copy>

        <span className="text-primary">
          <Copy>Plate</Copy>
        </span>
      </Link>

      <nav
        aria-label="Footer navigation"
        className="flex flex-wrap gap-5 text-sm text-muted-foreground"
      >
        <Link to="/store">
          <Copy>Store demo</Copy>
        </Link>

        <Link to="/studio">
          <Copy>Studio demo</Copy>
        </Link>

        <Link to="/orders">
          <Copy>Orders demo</Copy>
        </Link>

        <Link to="/history">
          <Copy>History demo</Copy>
        </Link>

        <Link to="/analytics">
          <Copy>Analytics demo</Copy>
        </Link>

        <Link to="/auth">
          <Copy>Log in</Copy>
        </Link>
      </nav>

      <p className="text-xs text-muted-foreground">
        <Copy>© 2026 WhitePlate</Copy>
      </p>
    </footer>
  )
}

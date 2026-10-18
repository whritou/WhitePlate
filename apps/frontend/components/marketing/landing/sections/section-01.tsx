"use client"
import { Copy } from "@/components/shared/translated-copy"
import { Link } from "@/components/demo/shared/navigation"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/lovable-button"
import { AccountControl } from "@/components/marketing/landing/account-control"
import { LocaleControl } from "../../../demo/workspace/shell/locale-control"
export function LandingSection1() {
  return (
    <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 border-b px-6 py-5">
      <Link to="/" className="text-2xl font-bold">
        <Copy>White</Copy>

        <span className="text-primary">
          <Copy>Plate</Copy>
        </span>
      </Link>

      <nav
        aria-label="Landing navigation"
        className="hidden gap-6 text-sm text-muted-foreground lg:flex"
      >
        <a href="#features">
          <Copy>Product</Copy>
        </a>

        <a href="#storefront">
          <Copy>Theming Studio</Copy>
        </a>

        <a href="#workspace">
          <Copy>Workspace</Copy>
        </a>

        <a href="#pricing">
          <Copy>Plans</Copy>
        </a>

        <a href="#faq">
          <Copy>FAQ</Copy>
        </a>
      </nav>

      <div className="flex max-w-full flex-wrap items-center gap-2">
        <AccountControl />

        <Button asChild>
          <Link to="/register">
            <Copy>Create account</Copy>

            <ArrowRight />
          </Link>
        </Button>
      </div>

      <LocaleControl />
    </header>
  )
}

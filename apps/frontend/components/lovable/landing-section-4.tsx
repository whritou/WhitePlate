"use client"
import { Copy } from "@/components/lovable/copy"
import { Link } from "@/components/lovable/navigation"
import { ArrowUpRight, Check, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/lovable-button"
import { bowl } from "./landing-data"
import { MenuPreview } from "./MenuPreview"
import { OrderPreview } from "./OrderPreview"
export function LandingSection4() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20">
      <p className="text-xs font-semibold text-primary">
        <Copy>THE PRODUCT</Copy>
      </p>

      <h2 className="mt-4 max-w-2xl text-4xl font-bold md:text-5xl">
        <Copy>From the first dish to the last collection.</Copy>
      </h2>

      <div className="mt-14 grid items-center gap-10 md:grid-cols-2">
        <div>
          <span className="text-sm text-primary">
            <Copy>01 / MENU BUILDER</Copy>
          </span>

          <h3 className="mt-3 text-3xl font-bold">
            <Copy>More than a name and a price.</Copy>
          </h3>

          <p className="mt-4 text-muted-foreground">
            <Copy>
              Give every dish its own photo gallery, options and extras. Keep
              categories in order, manage availability and translate the details
              your customers see.
            </Copy>
          </p>

          <ul className="mt-6 space-y-3 text-sm">
            <Copy>
              {[
                "Multiple images, with reorderable galleries",
                "Categories, dish ordering & availability",
                "Editable allergens, assigned per dish",
                "Translated categories, dishes, options & allergens",
                "Item VAT and discount codes with rules",
              ].map((x) => (
                <li key={x} className="flex gap-3">
                  <Check size={17} className="shrink-0 text-primary" />

                  <Copy>{x}</Copy>
                </li>
              ))}
            </Copy>
          </ul>

          <Button asChild variant="link" className="mt-5 px-0">
            <Link to="/menu">
              <Copy>View menu builder demo</Copy>

              <ArrowUpRight />
            </Link>
          </Button>
        </div>

        <MenuPreview />
      </div>

      <div className="mt-20 grid items-center gap-10 md:grid-cols-2">
        <div className="md:order-2">
          <span className="text-sm text-primary">
            <Copy>02 / CUSTOMER ORDERING</Copy>
          </span>

          <h3 className="mt-3 text-3xl font-bold">
            <Copy>A customer journey in your colors.</Copy>
          </h3>

          <p className="mt-4 text-muted-foreground">
            <Copy>
              From choosing extras to checking pickup details, the store,
              checkout and tracking pages share the same restaurant identity.
            </Copy>
          </p>

          <ul className="mt-6 space-y-3 text-sm">
            <Copy>
              {[
                "Product details, image galleries & option selection",
                "Basket quantities and discount validation",
                "Pickup selection, contact fields & order notes",
                "Branded order summary and tracking page",
              ].map((x) => (
                <li key={x} className="flex gap-3">
                  <Check size={17} className="shrink-0 text-primary" />

                  <Copy>{x}</Copy>
                </li>
              ))}
            </Copy>
          </ul>

          <Button asChild variant="link" className="mt-4 px-0">
            <Link to="/store">
              <Copy>View customer ordering demo</Copy>

              <ArrowUpRight />
            </Link>
          </Button>
        </div>

        <div className="overflow-hidden border md:order-1">
          <img
            src={bowl}
            alt="Green bowl with fresh vegetables"
            className="aspect-[4/3] w-full object-cover"
          />

          <div className="flex items-center justify-between bg-accent px-5 py-4 text-sm font-semibold text-accent-foreground">
            <span>
              <Copy>Menu → Basket → Checkout → Tracking</Copy>
            </span>

            <ShoppingBag size={18} />
          </div>
        </div>
      </div>

      <div className="mt-20 grid items-center gap-10 md:grid-cols-2">
        <div>
          <span className="text-sm text-primary">
            <Copy>03 / SERVICE OPERATIONS</Copy>
          </span>

          <h3 className="mt-3 text-3xl font-bold">
            <Copy>Keep the whole service in view.</Copy>
          </h3>

          <p className="mt-4 text-muted-foreground">
            <Copy>
              Move tickets through the kitchen, find older completed orders and
              explore the numbers behind a service. One navigation bar keeps
              every tool within reach.
            </Copy>
          </p>

          <ul className="mt-6 space-y-3 text-sm">
            <Copy>
              {[
                "Draggable New, Preparing, Ready & Collected columns",
                "Order search, late indicators & service pause control",
                "Completed-order history, CSV export & receipts",
                "Revenue, top dishes, peak hours & kitchen metrics",
              ].map((x) => (
                <li key={x} className="flex gap-3">
                  <Check size={17} className="shrink-0 text-primary" />

                  <Copy>{x}</Copy>
                </li>
              ))}
            </Copy>
          </ul>

          <Button asChild variant="link" className="mt-5 px-0">
            <Link to="/orders">
              <Copy>View order board demo</Copy>

              <ArrowUpRight />
            </Link>
          </Button>
        </div>

        <OrderPreview />
      </div>
    </section>
  )
}

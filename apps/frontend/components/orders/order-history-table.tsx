import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Link } from "@/i18n/navigation"
import type {
  OrderHistoryFilters,
  OrderHistoryTableProps,
} from "@/types/orders"

export function OrderHistoryTable({
  tenantName,
  locale,
  filters,
  page,
}: OrderHistoryTableProps) {
  const t = useTranslations("OrderHistory")
  const pageCount = Math.max(1, Math.ceil(page.totalCount / page.pageSize))
  const query = {
    tenantId: filters.tenantId,
    status: filters.status ?? undefined,
    search: filters.search ?? undefined,
    from: filters.from ?? undefined,
    through: filters.through ?? undefined,
    sort: filters.sort,
    direction: filters.direction,
    pageSize: String(filters.pageSize),
  }
  const toggleSort = (sort: "createdAt" | "total") => {
    const params = new URLSearchParams()

    for (const [key, value] of Object.entries(query))
      if (value) params.set(key, String(value))
    params.set("sort", sort)
    params.set(
      "direction",
      filters.sort === sort && filters.direction === "desc" ? "asc" : "desc"
    )
    params.set("page", "1")

    return `/organization/order-history?${params}`
  }

  return (
    <main className="mx-auto grid min-h-[70vh] w-full min-w-0 gap-5 p-4 sm:p-6 lg:p-8">
      <header>
        <p className="text-sm font-medium text-primary">{tenantName}</p>

        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-[2rem]">
          {t("title")}
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {t("description")}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{t("filtersTitle")}</CardTitle>
        </CardHeader>

        <CardContent>
          <form
            method="get"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
          >
            <input type="hidden" name="tenantId" value={filters.tenantId} />

            <div className="grid gap-2 text-sm font-medium lg:col-span-2">
              <Label htmlFor="history-search">{t("search")}</Label>

              <Input
                id="history-search"
                name="search"
                defaultValue={filters.search ?? ""}
                placeholder={t("searchPlaceholder")}
              />
            </div>

            <div className="grid gap-2 text-sm font-medium">
              <Label htmlFor="history-status">{t("status")}</Label>

              <NativeSelect
                id="history-status"
                name="status"
                defaultValue={filters.status ?? "all"}
              >
                <NativeSelectOption value="all">
                  {t("allStatuses")}
                </NativeSelectOption>

                {(
                  [
                    "Pending",
                    "Preparing",
                    "Ready",
                    "Completed",
                    "Cancelled",
                  ] as const
                ).map((status) => (
                  <NativeSelectOption key={status} value={status}>
                    {t(`statuses.${status}`)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            <div className="grid gap-2 text-sm font-medium">
              <Label htmlFor="history-from">{t("from")}</Label>

              <Input
                id="history-from"
                type="date"
                name="from"
                defaultValue={filters.from ?? ""}
              />
            </div>

            <div className="grid gap-2 text-sm font-medium">
              <Label htmlFor="history-through">{t("through")}</Label>

              <Input
                id="history-through"
                type="date"
                name="through"
                defaultValue={filters.through ?? ""}
              />
            </div>

            <input type="hidden" name="sort" value={filters.sort} />

            <input type="hidden" name="direction" value={filters.direction} />

            <input type="hidden" name="pageSize" value={filters.pageSize} />

            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
              <Button type="submit">{t("applyFilters")}</Button>

              <Button
                variant="outline"
                render={
                  <Link
                    href={`/organization/order-history?tenantId=${encodeURIComponent(filters.tenantId)}`}
                  />
                }
              >
                {t("clearFilters")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("resultsTitle", { count: page.totalCount })}</CardTitle>
        </CardHeader>

        <CardContent>
          {page.items.length === 0 ? (
            <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              {t("noResults")}
            </p>
          ) : (
            <Table>
              <caption className="sr-only">{t("tableDescription")}</caption>

              <TableHeader>
                <TableRow>
                  <TableHead>{t("order")}</TableHead>

                  <TableHead>{t("customer")}</TableHead>

                  <TableHead>{t("items")}</TableHead>

                  <TableHead>{t("status")}</TableHead>

                  <TableHead>
                    <Link
                      href={toggleSort("total")}
                      className="inline-flex min-h-11 items-center gap-1 hover:underline"
                    >
                      {t("total")}

                      {sortIcon(filters, "total")}
                    </Link>
                  </TableHead>

                  <TableHead>
                    <Link
                      href={toggleSort("createdAt")}
                      className="inline-flex min-h-11 items-center gap-1 hover:underline"
                    >
                      {t("createdAt")}

                      {sortIcon(filters, "createdAt")}
                    </Link>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {page.items.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <span className="font-mono text-xs">
                        {order.id.slice(0, 8).toUpperCase()}
                      </span>
                    </TableCell>

                    <TableCell className="font-medium">
                      {order.customerName}
                    </TableCell>

                    <TableCell>
                      <ul className="grid gap-1">
                        {order.lines.map((line) => (
                          <li key={line.productId}>
                            {t("lineItem", {
                              quantity: line.quantity,
                              product: line.productName,
                            })}

                            {line.options.length > 0 && (
                              <span className="block text-xs text-muted-foreground">
                                {line.options
                                  .map((option) => option.name)
                                  .join(", ")}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          order.status === "Cancelled"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {t(`statuses.${order.status}`)}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {new Intl.NumberFormat(locale, {
                        style: "currency",
                        currency: order.currency,
                      }).format(order.total)}
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      {new Intl.DateTimeFormat(locale, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(order.createdAt))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <nav
            aria-label={t("paginationLabel")}
            className="mt-4 flex flex-wrap items-center justify-between gap-3"
          >
            <p className="text-sm text-muted-foreground">
              {t("pageOf", { page: page.page, pages: pageCount })}
            </p>

            <div className="flex gap-2">
              {page.page > 1 ? (
                <Button
                  variant="outline"
                  render={<Link href={pageHref(filters, page.page - 1)} />}
                >
                  {t("previous")}
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  {t("previous")}
                </Button>
              )}

              {page.page < pageCount ? (
                <Button
                  variant="outline"
                  render={<Link href={pageHref(filters, page.page + 1)} />}
                >
                  {t("next")}
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  {t("next")}
                </Button>
              )}
            </div>
          </nav>
        </CardContent>
      </Card>
    </main>
  )
}

function pageHref(filters: OrderHistoryFilters, page: number) {
  const query = new URLSearchParams({
    tenantId: filters.tenantId,
    page: String(page),
    pageSize: String(filters.pageSize),
    sort: filters.sort,
    direction: filters.direction,
  })

  if (filters.status) query.set("status", filters.status)
  if (filters.search) query.set("search", filters.search)
  if (filters.from) query.set("from", filters.from)
  if (filters.through) query.set("through", filters.through)

  return `/organization/order-history?${query}`
}

function sortIcon(filters: OrderHistoryFilters, sort: "createdAt" | "total") {
  const Icon =
    filters.sort !== sort
      ? ArrowUpDown
      : filters.direction === "desc"
        ? ArrowDown
        : ArrowUp

  return <Icon aria-hidden="true" className="size-4" />
}

import { getLocale, getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { isUuid } from "@/lib/validation/common"
import { getRestaurantMemberships } from "@/services/orders"
import { getManagedCatalog } from "@/services/catalog-management"
import { Link } from "@/i18n/navigation"
import { CategoryForm } from "@/components/organization/category-form"
import { ProductForm } from "@/components/organization/product-form"
import { ArchiveCatalogButton } from "@/components/organization/archive-catalog-button"
import { RestoreProductButton } from "@/components/organization/restore-product-button"
import { OptionGroupsEditor } from "@/components/organization/option-groups-editor"
import { DiscountsEditor } from "@/components/organization/discounts-editor"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import type { CatalogPageProps } from "@/types/catalog-management"

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const [locale, query] = await Promise.all([getLocale(), searchParams])
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect(`/${locale}/sign-in`)
  if (!session.user.emailVerified) redirect(`/${locale}/verify-email`)

  const t = await getTranslations("Catalog")
  const memberships = await getRestaurantMemberships()
  const restaurant =
    memberships.ok && isUuid(query.tenantId)
      ? memberships.data?.find(
          (item) =>
            item.id === query.tenantId &&
            (item.role === "OrganizationOwner" || item.role === "Manager")
        )
      : null
  const response = restaurant ? await getManagedCatalog(restaurant.id) : null
  const catalog = response?.ok ? response.data : null

  if (!catalog || !restaurant) {
    return (
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            {t(
              `errors.${!memberships.ok || (response && !response.ok && response.error === "unavailable") ? "unavailable" : "forbidden"}`
            )}
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  const categories = [...catalog.categories].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)
  )

  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <Link
        href="/organization"
        className="text-sm text-primary hover:underline"
      >
        {t("back")}
      </Link>

      <header className="my-6">
        <p className="text-sm text-muted-foreground">
          {restaurant.name} · {catalog.currency}
        </p>

        <h1 className="mt-2 text-2xl font-semibold sm:text-[2rem]">
          {t("title")}
        </h1>

        <p className="mt-2 text-muted-foreground">{t("intro")}</p>
      </header>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>{t("newCategory")}</h2>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <CategoryForm tenantId={catalog.tenantId} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <h2>{t("newProduct")}</h2>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <ProductForm
              tenantId={catalog.tenantId}
              currency={catalog.currency}
              categories={categories}
            />
          </CardContent>
        </Card>

        <DiscountsEditor
          tenantId={catalog.tenantId}
          currency={catalog.currency}
          discounts={catalog.discounts}
        />

        {categories.length === 0 && (
          <p className="text-muted-foreground">{t("empty")}</p>
        )}

        <ul className="grid gap-6">
          {categories.map((category) => (
            <li key={category.id}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    <h2 className="text-lg">{category.name}</h2>
                  </CardTitle>

                  {category.isArchived && (
                    <CardDescription>
                      <Badge>{t("archived")}</Badge>
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="grid gap-6">
                  {!category.isArchived && (
                    <CategoryForm
                      tenantId={catalog.tenantId}
                      category={category}
                      key={`${category.id}:${category.name}:${category.sortOrder}`}
                    />
                  )}

                  {!category.isArchived && (
                    <ArchiveCatalogButton
                      tenantId={catalog.tenantId}
                      id={category.id}
                      entityType="categories"
                      name={category.name}
                    />
                  )}

                  <ul className="grid gap-6">
                    {catalog.products
                      .filter((product) => product.categoryId === category.id)
                      .sort(
                        (a, b) =>
                          a.sortOrder - b.sortOrder ||
                          a.name.localeCompare(b.name)
                      )
                      .map((product) => (
                        <li key={product.id}>
                          <Card>
                            <CardHeader>
                              <CardTitle>
                                <h3 className="text-base">{product.name}</h3>
                              </CardTitle>

                              <CardDescription>
                                {product.basePrice.toFixed(2)}{" "}
                                {catalog.currency} ·{" "}
                                {t("taxValue", {
                                  value: product.taxRatePercent,
                                })}
                              </CardDescription>

                              <Badge>
                                {t(
                                  product.isArchived
                                    ? "archived"
                                    : product.isAvailable
                                      ? "available"
                                      : "unavailable"
                                )}
                              </Badge>
                            </CardHeader>

                            {!product.isArchived && !category.isArchived && (
                              <CardContent className="grid gap-4">
                                <ProductForm
                                  tenantId={catalog.tenantId}
                                  currency={catalog.currency}
                                  categories={categories}
                                  product={product}
                                  key={JSON.stringify(product)}
                                />

                                <ArchiveCatalogButton
                                  tenantId={catalog.tenantId}
                                  id={product.id}
                                  entityType="products"
                                  name={product.name}
                                />
                              </CardContent>
                            )}

                            {product.isArchived && !category.isArchived && (
                              <CardContent>
                                <RestoreProductButton
                                  tenantId={catalog.tenantId}
                                  id={product.id}
                                />
                              </CardContent>
                            )}

                            <CardContent>
                              <OptionGroupsEditor
                                tenantId={catalog.tenantId}
                                currency={catalog.currency}
                                productId={product.id}
                                productName={product.name}
                                optionGroups={catalog.optionGroups}
                                options={catalog.options}
                                parentArchived={
                                  product.isArchived || category.isArchived
                                }
                              />
                            </CardContent>
                          </Card>
                        </li>
                      ))}
                  </ul>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}

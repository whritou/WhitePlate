"use client"

import { useLocale, useTranslations } from "next-intl"
import { OrderTicket } from "@/components/orders/order-ticket"
import { WorkspaceShell } from "@/components/organization/workspace-shell"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { ResultMessage } from "@/components/auth/result-message"
import { ORDER_STATUSES } from "@/lib/order-dashboard"

const variants = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
] as const

export function DesignSystemTestHarness() {
  const t = useTranslations("DesignSystemTest")
  const catalog = useTranslations("Catalog")
  const locale = useLocale()

  return (
    <WorkspaceShell
      organizations={[{ id: "design-fixture", name: t("restaurant") }]}
      restaurants={[]}
    >
      <main className="mx-auto grid max-w-7xl gap-8 p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-semibold sm:text-[2rem]">{t("title")}</h1>

        <Card>
          <CardHeader>
            <CardTitle>
              <h2>{t("controls")}</h2>
            </CardTitle>
          </CardHeader>

          <CardContent className="grid gap-4">
            <div className="flex flex-wrap gap-3" data-testid="button-samples">
              {variants.map((variant) => (
                <Button
                  key={variant}
                  variant={variant}
                  data-testid={`button-${variant}`}
                >
                  {t("action")} · {variant}
                </Button>
              ))}

              {variants.map((variant) => (
                <Button key={`disabled-${variant}`} variant={variant} disabled>
                  {t("disabled")} · {variant}
                </Button>
              ))}

              {variants.map((variant) => (
                <Button
                  key={`pending-${variant}`}
                  variant={variant}
                  disabled
                  aria-busy="true"
                >
                  {catalog("saving")} · {variant}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              {variants.map((variant) => (
                <Badge key={variant} variant={variant}>
                  {t("badge")} · {variant}
                </Badge>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Label className="grid gap-2" htmlFor="design-name">
                {catalog("name")}
                <Input id="design-name" defaultValue={t("restaurant")} />
              </Label>

              <Label className="grid gap-2" htmlFor="design-select">
                {catalog("availability")}
                <NativeSelect id="design-select">
                  <NativeSelectOption>
                    {catalog("available")}
                  </NativeSelectOption>
                </NativeSelect>
              </Label>

              <Label className="grid gap-2" htmlFor="design-disabled">
                {t("disabled")}
                <Input
                  id="design-disabled"
                  disabled
                  value={t("action")}
                  readOnly
                />
              </Label>

              <Label className="grid gap-2" htmlFor="design-description">
                {catalog("description")}
                <Textarea
                  id="design-description"
                  defaultValue={t("longLabel")}
                />
              </Label>
            </div>

            <Label>
              <Checkbox aria-label={catalog("available")} defaultChecked />
              {catalog("available")}
            </Label>

            <RadioGroup defaultValue="available">
              <Label>
                <RadioGroupItem
                  value="available"
                  aria-label={catalog("available")}
                />
                {catalog("available")}
              </Label>
            </RadioGroup>

            <Button variant="outline" className="w-full">
              {t("longLabel")}
            </Button>

            <ResultMessage
              state={{ status: "success" }}
              message={catalog("saved")}
            />

            <ResultMessage
              state={{ status: "error" }}
              message={catalog("errors.unavailable")}
            />
          </CardContent>
        </Card>

        <section className="grid gap-4" aria-label={t("orders")}>
          <h2 className="text-xl font-semibold">{t("orders")}</h2>

          <div className="grid gap-4 lg:grid-cols-2">
            {ORDER_STATUSES.map((status, index) => (
              <OrderTicket
                key={status}
                locale={locale}
                role="OrganizationOwner"
                pending={null}
                onUpdate={async () => {}}
                order={{
                  id: `a82f000${index}-1111-4111-8111-000000000001`,
                  customerName: "Camille",
                  currency: "EUR",
                  menuLocale: locale,
                  total: 23,
                  status,
                  version: 1,
                  createdAt: "2026-10-06T10:42:00Z",
                  lines: [
                    {
                      productId: "fixture",
                      productName: t("longLabel"),
                      quantity: 2,
                      options: [{ optionId: "bread", name: t("restaurant") }],
                    },
                  ],
                }}
              />
            ))}
          </div>
        </section>
      </main>
    </WorkspaceShell>
  )
}

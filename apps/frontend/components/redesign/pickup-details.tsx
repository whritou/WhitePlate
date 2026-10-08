"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  Clock,
  CreditCard,
  Leaf,
  MapPin,
  ShoppingBag,
  UserRound,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

export function PickupDetails({
  name,
  onNameChange,
}: {
  name: string
  onNameChange: (name: string) => void
}) {
  const t = useTranslations("Redesign")
  const [scheduled, setScheduled] = useState(false)
  const [payment, setPayment] = useState("apple")
  const [eco, setEco] = useState(true)

  return (
    <div className="grid min-w-0 gap-6">
      <Card className="gap-5 border-0 p-6">
        <SectionTitle
          icon={<ShoppingBag />}
          title={t("fulfillmentTitle")}
          description={t("fulfillmentDescription")}
        />

        <CardContent className="grid gap-4 p-0">
          <div
            role="group"
            aria-label={t("fulfillmentTitle")}
            className="grid gap-3 sm:grid-cols-2"
          >
            <Button
              variant="secondary"
              aria-pressed={!scheduled}
              onClick={() => setScheduled(false)}
              className={`min-h-24 justify-start border p-4 text-left ${!scheduled ? "border-primary bg-secondary" : "border-transparent bg-muted"}`}
            >
              <Zap aria-hidden="true" />

              <span>
                <strong className="block">{t("asap")}</strong>

                <span className="mt-2 block text-xs font-normal">
                  {t("readyAt")}
                </span>
              </span>
            </Button>

            <Button
              variant="secondary"
              aria-pressed={scheduled}
              onClick={() => setScheduled(true)}
              className={`min-h-24 justify-start border p-4 text-left ${scheduled ? "border-primary bg-secondary" : "border-transparent bg-muted"}`}
            >
              <Clock aria-hidden="true" />

              <span>
                <strong className="block">{t("scheduleLater")}</strong>

                <span className="mt-2 block text-xs font-normal">
                  {t("reservedSlot")}
                </span>
              </span>
            </Button>
          </div>

          {scheduled && (
            <div>
              <Label htmlFor="pickup-slot">{t("pickupTime")}</Label>

              <NativeSelect id="pickup-slot" className="mt-2">
                <NativeSelectOption>13:30–13:45</NativeSelectOption>

                <NativeSelectOption>13:45–14:00</NativeSelectOption>

                <NativeSelectOption>14:00–14:15</NativeSelectOption>

                <NativeSelectOption>14:15–14:30</NativeSelectOption>
              </NativeSelect>
            </div>
          )}

          <p className="flex items-center gap-3 rounded-md bg-muted p-4 text-sm">
            <MapPin
              aria-hidden="true"
              className="size-5 shrink-0 text-primary"
            />

            <span>
              <strong className="block">{t("storeLocation")}</strong>

              <span className="mt-1 block text-xs text-muted-foreground">
                Artisan Burger Co. · {t("fullAddress")}
              </span>
            </span>
          </p>
        </CardContent>
      </Card>

      <Card className="gap-5 border-0 p-6">
        <SectionTitle
          icon={<UserRound />}
          title={t("contactTitle")}
          description={t("contactDescription")}
        />

        <CardContent className="grid gap-4 p-0">
          <Label htmlFor="demo-name" className="grid gap-2">
            {t("fullName")}

            <Input
              id="demo-name"
              name="name"
              autoComplete="name"
              required
              maxLength={200}
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              className="border-transparent bg-muted"
            />
          </Label>

          <div className="grid gap-4 sm:grid-cols-2">
            <Label htmlFor="demo-phone" className="grid gap-2">
              {t("phone")}

              <Input
                id="demo-phone"
                type="tel"
                autoComplete="tel"
                defaultValue="(415) 890-2341"
                className="border-transparent bg-muted"
              />
            </Label>

            <Label htmlFor="demo-email" className="grid gap-2">
              {t("receiptEmail")}

              <Input
                id="demo-email"
                type="email"
                autoComplete="email"
                defaultValue="marcus@example.com"
                className="border-transparent bg-muted"
              />
            </Label>
          </div>

          <Label htmlFor="arrival-note" className="grid gap-2">
            {t("arrivalNotes")}

            <Input
              id="arrival-note"
              placeholder={t("arrivalPlaceholder")}
              className="border-transparent bg-muted"
            />
          </Label>
        </CardContent>
      </Card>

      <Card className="gap-5 border-0 p-6">
        <SectionTitle
          icon={<CreditCard />}
          title={t("paymentTitle")}
          description={t("paymentDescription")}
        />

        <CardContent className="grid gap-5 p-0">
          <div
            role="group"
            aria-label={t("paymentTitle")}
            className="grid gap-2 sm:grid-cols-3"
          >
            {["apple", "google", "store"].map((method) => (
              <Button
                key={method}
                variant={payment === method ? "default" : "secondary"}
                aria-pressed={payment === method}
                onClick={() => setPayment(method)}
                className={
                  method === "apple" && payment === method
                    ? "bg-obsidian text-white hover:bg-obsidian/90"
                    : ""
                }
              >
                {t(`pay${method}`)}
              </Button>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            {t("cardPreview")}
          </p>

          <Label htmlFor="demo-card" className="grid gap-2">
            {t("cardNumber")}

            <Input
              id="demo-card"
              readOnly
              value="•••• •••• •••• 4242"
              className="border-transparent bg-muted"
            />
          </Label>

          <div className="grid grid-cols-2 gap-4">
            <Label htmlFor="demo-expiry" className="grid gap-2">
              {t("expiry")}

              <Input
                id="demo-expiry"
                readOnly
                value="08 / 28"
                className="border-transparent bg-muted"
              />
            </Label>

            <Label htmlFor="demo-cvc" className="grid gap-2">
              CVC
              <Input
                id="demo-cvc"
                readOnly
                value="•••"
                className="border-transparent bg-muted"
              />
            </Label>
          </div>

          <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
            {t("paymentDemoNotice")}
          </p>
        </CardContent>
      </Card>

      <Card className="gap-4 border-0 p-6">
        <Label className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-3">
            <Leaf aria-hidden="true" className="size-5 text-primary" />

            <span>
              <strong className="block">{t("ecoTitle")}</strong>

              <span className="mt-1 block text-xs text-muted-foreground">
                {t("ecoDescription")}
              </span>
            </span>
          </span>

          <Checkbox
            checked={eco}
            onCheckedChange={setEco}
            aria-label={t("ecoTitle")}
          />
        </Label>

        <Label htmlFor="kitchen-note" className="grid gap-2">
          {t("allergyNotes")}

          <Input
            id="kitchen-note"
            placeholder={t("allergyPlaceholder")}
            className="border-transparent bg-muted"
          />
        </Label>
      </Card>
    </div>
  )
}

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <CardHeader className="flex flex-row items-start gap-3 p-0">
      <span
        aria-hidden="true"
        className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary [&_svg]:size-5"
      >
        {icon}
      </span>

      <div>
        <CardTitle>
          <h2 className="text-xl">{title}</h2>
        </CardTitle>

        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </CardHeader>
  )
}

"use client"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import {
  SourceButton,
  SourceInput,
  SourceLabel,
} from "@/components/ui/lovable-controls"
import { Copy } from "@/components/lovable/copy"
import {
  Card,
  SECTIONS,
  input,
} from "@/components/lovable/pages/settings-shared"
import { SettingsPageProvider } from "@/components/lovable/pages/settings-SettingsPage-context"
import { useSettingsPageModel } from "@/components/lovable/pages/settings-SettingsPage-model"
import { SettingsPanel3 } from "@/components/lovable/pages/settings-panel-3"
import { SettingsPanel4 } from "@/components/lovable/pages/settings-panel-4"
import { SettingsPanel5 } from "@/components/lovable/pages/settings-panel-5"
import { MissingFeatureNotice } from "./missing-feature-notice"
import type { LiveSettingsProps } from "@/types/live-workspace"

export function LiveSettings({
  organization,
  userId,
  children,
}: LiveSettingsProps) {
  const t = useTranslations("LiveWorkspace")
  const model = useSettingsPageModel(
    `whiteplate-live-draft:${userId}:${organization.id}:settings`
  )
  const simulated = [
    "payments",
    "billing",
    "domains",
    "notifications",
  ].includes(model.sec)

  function select(section: typeof model.sec) {
    model.setSec(section)

    const url = new URL(window.location.href)

    url.searchParams.set("section", section)
    window.history.replaceState(null, "", url.pathname + url.search + url.hash)
  }

  return (
    <SettingsPageProvider model={model}>
      <main className="min-w-0 bg-background">
        <header className="flex flex-wrap items-end justify-between gap-6 px-6 pt-8 pb-6">
          <div>
            <p className="label-mono text-muted-foreground">
              {organization.name}
            </p>

            <h1 className="mt-1 font-display text-4xl font-bold">
              <Copy>Settings</Copy>
            </h1>
          </div>

          {simulated && (
            <SourceButton
              className="btn-primary disabled:opacity-40"
              disabled={!model.dirty}
              onClick={model.save}
            >
              {t("saveDraft")}
            </SourceButton>
          )}
        </header>

        <div className="grid gap-6 px-6 pb-12 lg:grid-cols-[240px_1fr]">
          <aside
            className="h-fit border lg:sticky lg:top-6"
            aria-label={t("settingsSections")}
          >
            {SECTIONS.map(([section, label, description], index) => (
              <SourceButton
                key={section}
                onClick={() => select(section)}
                aria-current={model.sec === section ? "page" : undefined}
                className={`block w-full px-4 py-3 text-left ${index ? "border-t" : ""} ${model.sec === section ? "bg-foreground text-background" : "hover:bg-secondary"}`}
              >
                <span
                  className={`block font-display font-bold ${section === "danger" && model.sec !== section ? "text-destructive" : ""}`}
                >
                  <Copy>{label}</Copy>
                </span>

                <span
                  className={`label-mono ${model.sec === section ? "opacity-70" : "text-muted-foreground"}`}
                >
                  <Copy>{description}</Copy>
                </span>
              </SourceButton>
            ))}
          </aside>

          <div className="min-w-0 space-y-6">
            {simulated && <MissingFeatureNotice />}

            {(model.sec === "org" || model.sec === "danger") && (
              <Card title="Organization profile" sub={t("realOrganization")}>
                <div className="mb-5 flex min-w-0 items-center gap-4 border-b pb-5">
                  <div className="grid size-16 shrink-0 place-items-center bg-primary font-display text-2xl font-bold text-primary-foreground">
                    {organization.name.slice(0, 1)}
                  </div>

                  <div className="min-w-0">
                    <p className="font-display text-lg font-bold">
                      {organization.name}
                    </p>

                    <p className="label-mono text-muted-foreground">
                      {organization.id}
                    </p>
                  </div>
                </div>

                {children}
              </Card>
            )}

            {model.sec === "org" && (
              <Card title="Company & legal" sub={t("legalPending")}>
                <MissingFeatureNotice />

                <fieldset className="mt-5 grid gap-4 md:grid-cols-2" disabled>
                  {(
                    [
                      [t("legalName"), model.s.org.legal],
                      [t("vat"), model.s.org.vat],
                      [t("siret"), model.s.org.siret],
                      [t("billingEmail"), model.s.org.email],
                    ] as const
                  ).map(([label, value]) => (
                    <SourceLabel key={label} className="grid gap-2 text-sm">
                      {label}

                      <SourceInput className={input} value={value} readOnly />
                    </SourceLabel>
                  ))}
                </fieldset>
              </Card>
            )}

            {model.sec === "restaurants" && (
              <Card title="Restaurants" sub={t("realRestaurants")}>
                <Link
                  className="btn-primary"
                  href={`/organization/team?organizationId=${organization.id}`}
                >
                  {t("manageRestaurants")}
                </Link>

                <Link
                  className="btn-ghost mt-4"
                  href={`/organization/restaurants/new?organizationId=${organization.id}`}
                >
                  {t("addRestaurant")}
                </Link>
              </Card>
            )}

            {model.sec === "payments" && (
              <Card
                title="Stripe Connect"
                sub="Payments go straight to your own Stripe account. WhitePlate takes 0% per order."
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border p-5">
                  <div>
                    <p className="font-display text-lg font-bold">
                      <Copy>Not connected</Copy>
                    </p>

                    <p className="mt-2 text-sm text-muted-foreground">
                      {t("paymentsUnavailable")}
                    </p>
                  </div>

                  <SourceButton disabled className="btn-primary">
                    {t("connectStripe")}
                  </SourceButton>
                </div>

                <div className="mt-4 grid grid-cols-1 border sm:grid-cols-3">
                  {[
                    ["WhitePlate fee", "0%"],
                    ["Stripe fee", "By account"],
                    ["Payout", "Unavailable"],
                  ].map(([label, value], index) => (
                    <div
                      key={label}
                      className={`p-4 ${index ? "border-t sm:border-t-0 sm:border-l" : ""}`}
                    >
                      <p className="label-mono text-muted-foreground">
                        <Copy>{label}</Copy>
                      </p>

                      <p className="font-display text-2xl font-bold">
                        <Copy>{value}</Copy>
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <SettingsPanel3 />

            <SettingsPanel4 />

            <SettingsPanel5 />

            {model.toast && (
              <p role="status" className="border bg-secondary p-3">
                {t("draftSaved")}
              </p>
            )}
          </div>
        </div>
      </main>
    </SettingsPageProvider>
  )
}

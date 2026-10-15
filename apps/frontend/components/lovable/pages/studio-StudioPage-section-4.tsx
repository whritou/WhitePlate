"use client"
import { Copy } from "@/components/lovable/copy"
import { useTranslations } from "next-intl"
import {
  SourceButton,
  SourceInput,
  SourceLabel,
} from "@/components/ui/lovable-controls"
import { Button } from "@/components/ui/lovable-button"
import { StudioAppearance } from "@/components/lovable/StudioAppearance"
import { DEFAULT_THEME, PRESETS } from "@/lib/lovable/storeTheme"
import type { StoreTheme } from "@/types/lovable/storeTheme"
import { ImagePick, Group, Field } from "./studio-shared"
import { useStudioPageView } from "./studio-StudioPage-context"
export function StudioPageSection4() {
  const { t, setDnsOpen, panel, set, connected, logoPreset } =
    useStudioPageView()
  const text = useTranslations("ThemeStudio")
  const presets: { label: string; theme: Partial<StoreTheme> }[] = connected
    ? [
        ...PRESETS,
        {
          label: text("crispLight"),
          theme: {
            bg: "#ffffff",
            text: "#14201a",
            ambiance: "crisp-light" as const,
          },
        },
        {
          label: text("warmCream"),
          theme: {
            bg: "#fff8ef",
            text: "#2a1a12",
            ambiance: "warm-cream" as const,
          },
        },
        {
          label: text("bistroNoir"),
          theme: {
            bg: "#111111",
            text: "#f3efe6",
            primary: "#e8e2d4",
            ambiance: "bistro-noir" as const,
          },
        },
        ...(logoPreset ? [{ label: text("fromLogo"), theme: logoPreset }] : []),
      ]
    : PRESETS

  return (
    <>
      {panel === "design" ? (
        <>
          <Group title="Presets">
            <div className="grid grid-cols-2 gap-2">
              <Copy>
                {presets.map((p) => (
                  <Button
                    variant="outline"
                    key={p.label}
                    onClick={() =>
                      set({
                        ambiance: "custom",
                        ...p.theme,
                        headingFont: p.theme.font ?? t.headingFont,
                      })
                    }
                    className="h-auto flex-col items-stretch p-2 text-left text-sm font-semibold"
                  >
                    <div className="mb-2 flex h-5">
                      <Copy>
                        {[
                          p.theme.bg ?? t.bg,
                          p.theme.primary ?? t.primary,
                          p.theme.accent ?? t.accent,
                          p.theme.text ?? t.text,
                        ].map((c, i) => (
                          <span
                            key={i}
                            className="flex-1"
                            style={{ background: c }}
                          />
                        ))}
                      </Copy>
                    </div>

                    <Copy>{p.label}</Copy>
                  </Button>
                ))}
              </Copy>
            </div>
          </Group>

          <Group title="Colors">
            <Copy>
              {(
                [
                  ["primary", "Primary"],
                  ["accent", "Accent"],
                  ["bg", "Background"],
                  ["text", "Text"],
                ] as const
              ).map(([k, l]) => (
                <SourceLabel
                  key={k}
                  className="flex items-center justify-between border px-3 py-2 text-sm"
                >
                  <Copy>{l}</Copy>

                  <SourceInput
                    aria-label={`${l} color`}
                    type="color"
                    value={t[k]}
                    onChange={(e) =>
                      set({ [k]: e.target.value, ambiance: "custom" })
                    }
                    className="h-7 w-7 cursor-pointer border-0 bg-transparent p-0"
                  />
                </SourceLabel>
              ))}
            </Copy>
          </Group>

          <StudioAppearance t={t} set={set} connected={connected} />

          <Button
            variant="link"
            onClick={() => set(DEFAULT_THEME)}
            className="px-0 text-muted-foreground"
          >
            <Copy>Reset to default</Copy>
          </Button>
        </>
      ) : (
        <>
          <Group title="Brand">
            <Field label="Restaurant name">
              <SourceInput
                value={t.name}
                onChange={(e) => set({ name: e.target.value })}
                className="w-full border bg-background px-3 py-2 text-sm"
              />
            </Field>

            <Field label="Tagline">
              <SourceInput
                value={t.tagline}
                onChange={(e) => set({ tagline: e.target.value })}
                className="w-full border bg-background px-3 py-2 text-sm"
              />
            </Field>
          </Group>

          <Group title="Images">
            <ImagePick
              label="Logo"
              value={t.logo}
              onChange={(v) => set({ logo: v })}
            />

            <ImagePick
              label="Banner"
              value={t.banner}
              onChange={(v) => set({ banner: v })}
              wide
            />

            <ImagePick
              label="Favicon"
              value={t.favicon}
              onChange={(v) => set({ favicon: v })}
            />
          </Group>

          <Group title="Restaurant info">
            <Copy>
              {(
                [
                  ["address", "Address"],
                  ["hours", "Opening hours"],
                  ["phone", "Phone"],
                  ["prepTime", "Prep time"],
                ] as const
              ).map(([k, l]) => (
                <Field key={k} label={l}>
                  <SourceInput
                    value={t[k]}
                    onChange={(e) => set({ [k]: e.target.value })}
                    className="w-full border bg-background px-3 py-2 text-sm"
                  />
                </Field>
              ))}
            </Copy>
          </Group>

          <Group title="Domain">
            <div className="border p-3">
              <p className="text-sm font-semibold">
                <Copy>{t.domain || "No custom domain"}</Copy>
              </p>

              <p
                className={`label-mono mt-1 ${t.domainStatus === "connected" ? "text-primary" : "text-muted-foreground"}`}
              >
                <Copy>
                  {t.domainStatus === "connected"
                    ? "● Connected · SSL active"
                    : t.domainStatus === "pending"
                      ? "◌ Waiting for DNS"
                      : "Using whiteplate subdomain"}
                </Copy>
              </p>
            </div>

            <SourceButton
              onClick={() => setDnsOpen(true)}
              className="btn-primary w-full justify-center py-2"
            >
              <Copy>Connect domain</Copy>
            </SourceButton>
          </Group>
        </>
      )}
    </>
  )
}

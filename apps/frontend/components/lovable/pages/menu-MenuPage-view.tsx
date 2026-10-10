"use client"
import { Copy } from "@/components/lovable/copy"
import { SourceButton, SourceInput } from "@/components/ui/lovable-controls"
import { Button } from "@/components/ui/lovable-button"
import { LANGS } from "@/lib/lovable/menu"
import { uid, input, countMissing } from "./menu-shared"
import { useMenuPageView } from "./menu-MenuPage-context"
import { MenuPageSection1 } from "./menu-MenuPage-section-1"
import { MenuPageSection13 } from "./menu-MenuPage-section-13"
export function MenuPageView() {
  const {
    m,
    tab,
    setTab,
    lang,
    setLang,
    saved,
    base,
    update,
    T,
    publish,
    all,
  } = useMenuPageView()

  return (
    <div className="flex min-h-screen flex-col bg-background lg:h-screen">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3">
        <h1 className="font-display text-xl font-bold">
          <Copy>Menu builder</Copy>
        </h1>

        <div className="flex max-w-full flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">
            <Copy>{all.length}</Copy> <Copy> dishes</Copy>
          </span>

          <Button onClick={publish}>
            <Copy>{saved ? "Saved in this browser ✓" : "Save demo menu"}</Copy>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6">
        <nav className="flex max-w-full overflow-x-auto">
          <Copy>
            {(
              [
                ["dishes", "Dishes"],
                ["allergens", "Allergens"],
                ["discounts", "Discount codes"],
                ["languages", "Languages"],
              ] as const
            ).map(([k, l]) => (
              <SourceButton
                key={k}
                onClick={() => setTab(k)}
                className={`label-mono border-b-2 px-4 py-3 ${tab === k ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
              >
                <Copy>{l}</Copy>
              </SourceButton>
            ))}
          </Copy>
        </nav>

        <Copy>
          {(tab === "dishes" || tab === "allergens") && (
            <div className="flex items-center gap-2 py-2">
              <span className="label-mono text-muted-foreground">
                <Copy>Editing in</Copy>
              </span>

              <Copy>
                {m.languages.map((l) => (
                  <SourceButton
                    key={l}
                    onClick={() => setLang(l)}
                    className={`label-mono border px-2.5 py-1.5 ${lang === l ? "bg-accent" : ""}`}
                  >
                    <Copy>
                      {l.toUpperCase()}

                      <Copy></Copy>

                      {l === base ? " ·base" : ""}
                    </Copy>
                  </SourceButton>
                ))}
              </Copy>
            </div>
          )}
        </Copy>
      </div>

      <Copy>
        {lang !== base && (tab === "dishes" || tab === "allergens") && (
          <p className="label-mono bg-accent px-6 py-1.5">
            <Copy>Translating to </Copy>
            <Copy>{LANGS[lang]}</Copy>{" "}
            <Copy> — empty fields fall back to </Copy>
            <Copy>{LANGS[base]}</Copy>
            <Copy>. Prices and photos are shared.</Copy>
          </p>
        )}
      </Copy>

      <MenuPageSection1 />

      <Copy>
        {tab === "allergens" && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-3xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold">
                    <Copy>Allergens</Copy>
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    <Copy>
                      Edit the list, then assign allergens to each dish.
                    </Copy>
                  </p>
                </div>

                <SourceButton
                  onClick={() =>
                    update((d) => {
                      d.allergens.push({
                        id: uid(),
                        name: "New allergen",
                        icon: "⚠️",
                      })
                    })
                  }
                  className="btn-primary py-2"
                >
                  <Copy>+ Allergen</Copy>
                </SourceButton>
              </div>

              <Copy>
                {m.allergens.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 border p-3"
                  >
                    <SourceInput
                      value={a.icon}
                      onChange={(e) =>
                        update((d) => {
                          const x = d.allergens.find((y) => y.id === a.id)

                          if (x) x.icon = e.target.value
                        })
                      }
                      className="w-14 border bg-background px-2 py-2 text-center text-lg"
                      aria-label="Icon"
                    />

                    <Copy>
                      {T({
                        o: a,
                        f: "name",
                        at: (d) => d.allergens.find((y) => y.id === a.id),
                        cls: `${input} flex-1`,
                      })}
                    </Copy>

                    <span className="label-mono w-28 text-muted-foreground">
                      <Copy>
                        {all.filter((i) => i.allergens?.includes(a.id)).length}
                      </Copy>{" "}
                      <Copy> dishes</Copy>
                    </span>

                    <SourceButton
                      onClick={() =>
                        update((d) => {
                          d.allergens = d.allergens.filter((y) => y.id !== a.id)
                          d.categories.forEach((c) =>
                            c.items.forEach((i) => {
                              i.allergens = (i.allergens ?? []).filter(
                                (x) => x !== a.id
                              )
                            })
                          )
                        })
                      }
                      className="label-mono text-destructive"
                      aria-label="Delete allergen"
                    >
                      ✕
                    </SourceButton>
                  </div>
                ))}
              </Copy>
            </div>
          </div>
        )}
      </Copy>

      <MenuPageSection13 />

      <Copy>
        {tab === "languages" && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-3xl space-y-3">
              <h2 className="font-display text-2xl font-bold">
                <Copy>Languages</Copy>
              </h2>

              <p className="text-sm text-muted-foreground">
                <Copy>
                  The first language is your base. Customers can switch language
                  on your store.
                </Copy>
              </p>

              <Copy>
                {Object.entries(LANGS).map(([code, name]) => {
                  const on = m.languages.includes(code)
                  const missing =
                    on && code !== base ? countMissing(m, code) : 0

                  return (
                    <div
                      key={code}
                      className="flex items-center gap-3 border p-3"
                    >
                      <span className="label-mono w-10 font-bold">
                        <Copy>{code.toUpperCase()}</Copy>
                      </span>

                      <span className="flex-1 font-semibold">
                        <Copy>{name}</Copy>
                      </span>

                      <Copy>
                        {on && code === base && (
                          <span className="label-mono bg-accent px-2 py-1">
                            <Copy>Base</Copy>
                          </span>
                        )}
                      </Copy>

                      <Copy>
                        {on && code !== base && (
                          <>
                            <span
                              className={`label-mono ${missing ? "text-destructive" : "text-primary"}`}
                            >
                              <Copy>
                                {missing ? `${missing} missing` : "Complete ✓"}
                              </Copy>
                            </span>

                            <SourceButton
                              onClick={() => {
                                setLang(code)
                                setTab("dishes")
                              }}
                              className="label-mono border px-2 py-1"
                            >
                              <Copy>Translate</Copy>
                            </SourceButton>

                            <SourceButton
                              onClick={() =>
                                update((d) => {
                                  d.languages = [
                                    code,
                                    ...d.languages.filter((l) => l !== code),
                                  ]
                                })
                              }
                              className="label-mono border px-2 py-1"
                            >
                              <Copy>Make base</Copy>
                            </SourceButton>
                          </>
                        )}
                      </Copy>

                      <Copy>
                        {code !== base && (
                          <SourceButton
                            onClick={() =>
                              update((d) => {
                                d.languages = on
                                  ? d.languages.filter((l) => l !== code)
                                  : [...d.languages, code]
                              })
                            }
                            className={`label-mono w-20 border px-2 py-1 ${on ? "bg-foreground text-background" : ""}`}
                          >
                            <Copy>{on ? "Enabled" : "Enable"}</Copy>
                          </SourceButton>
                        )}
                      </Copy>
                    </div>
                  )
                })}
              </Copy>
            </div>
          </div>
        )}
      </Copy>
    </div>
  )
}

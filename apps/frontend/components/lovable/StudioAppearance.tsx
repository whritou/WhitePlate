"use client"
import { Copy } from "@/components/lovable/copy"
import {
  SourceInput,
  SourceSelect,
  SourceOption,
  SourceLabel,
} from "@/components/ui/lovable-controls"
import { Button } from "@/components/ui/lovable-button"
import { FONTS, FONT_PAIRS, type StoreTheme } from "@/lib/lovable/storeTheme"
export function StudioAppearance({
  t,
  set,
}: {
  t: StoreTheme
  set: (patch: Partial<StoreTheme>) => void
}) {
  return (
    <>
      <section className="space-y-4">
        <h2 className="text-sm font-bold">
          <Copy>Typography</Copy>
        </h2>

        <div className="grid grid-cols-2 gap-2">
          <Copy>
            {FONT_PAIRS.map((pair) => (
              <Button
                key={pair.label}
                variant={
                  t.headingFont === pair.headingFont && t.font === pair.font
                    ? "secondary"
                    : "outline"
                }
                className="h-auto flex-col items-start gap-1 p-3"
                onClick={() =>
                  set({ headingFont: pair.headingFont, font: pair.font })
                }
              >
                <span
                  style={{ fontFamily: pair.headingFont }}
                  className="text-lg"
                >
                  <Copy>Aa</Copy>
                </span>

                <span>
                  <Copy>{pair.label}</Copy>
                </span>

                <span className="text-[10px] font-normal text-muted-foreground">
                  <Copy>{pair.headingFont}</Copy>
                </span>
              </Button>
            ))}
          </Copy>
        </div>

        <FontSelect
          label="Heading font"
          value={t.headingFont}
          onChange={(headingFont) => set({ headingFont })}
        />

        <FontSelect
          label="Body font"
          value={t.font}
          onChange={(font) => set({ font })}
        />

        <SourceLabel className="block space-y-2 text-sm font-medium">
          <Copy>Heading weight</Copy>

          <SourceSelect
            aria-label="Heading weight"
            value={t.headingWeight}
            onChange={(e) => set({ headingWeight: Number(e.target.value) })}
            className="w-full border bg-background p-2"
          >
            <Copy>
              {[400, 500, 600, 700].map((w) => (
                <SourceOption key={w} value={w}>
                  <Copy>
                    {
                      {
                        400: "Regular",
                        500: "Medium",
                        600: "Semibold",
                        700: "Bold",
                      }[w as 400 | 500 | 600 | 700]
                    }
                  </Copy>
                </SourceOption>
              ))}
            </Copy>
          </SourceSelect>
        </SourceLabel>

        <SourceLabel className="block space-y-2 text-sm font-medium">
          <Copy>Body weight</Copy>

          <SourceSelect
            aria-label="Body weight"
            value={t.bodyWeight}
            onChange={(e) => set({ bodyWeight: Number(e.target.value) })}
            className="w-full border bg-background p-2"
          >
            <SourceOption value={400}>
              <Copy>Regular</Copy>
            </SourceOption>

            <SourceOption value={500}>
              <Copy>Medium</Copy>
            </SourceOption>
          </SourceSelect>
        </SourceLabel>

        <Range
          label="Text size"
          value={t.textScale}
          min={0.9}
          max={1.2}
          step={0.05}
          display={`${Math.round(t.textScale * 100)}%`}
          onChange={(textScale) => set({ textScale })}
        />

        <Range
          label="Line height"
          value={t.lineHeight}
          min={1.3}
          max={1.8}
          step={0.1}
          display={t.lineHeight.toFixed(1)}
          onChange={(lineHeight) => set({ lineHeight })}
        />

        <div className="border bg-secondary p-4">
          <p
            style={{ fontFamily: t.headingFont, fontWeight: t.headingWeight }}
            className="text-xl"
          >
            <Copy>Made with care.</Copy>
          </p>

          <p
            style={{
              fontFamily: t.font,
              fontWeight: t.bodyWeight,
              lineHeight: t.lineHeight,
            }}
            className="mt-2 text-sm"
          >
            <Copy>Seasonal dishes, ready to collect.</Copy>
          </p>
        </div>
      </section>

      <section className="space-y-4 border-t pt-6">
        <h2 className="text-sm font-bold">
          <Copy>Buttons & spacing</Copy>
        </h2>

        <Segments
          label="Button style"
          value={t.buttonStyle}
          options={["solid", "outline"]}
          onChange={(buttonStyle) => set({ buttonStyle })}
        />

        <Range
          label="Button corners"
          value={t.buttonRadius}
          min={0}
          max={28}
          display={`${t.buttonRadius}px`}
          onChange={(buttonRadius) => set({ buttonRadius })}
        />

        <Range
          label="Card corners"
          value={t.radius}
          min={0}
          max={24}
          display={`${t.radius}px`}
          onChange={(radius) => set({ radius })}
        />

        <Segments
          label="Spacing"
          value={t.spacing}
          options={["compact", "comfortable", "airy"]}
          onChange={(spacing) => set({ spacing })}
        />
      </section>

      <section className="space-y-4 border-t pt-6">
        <h2 className="text-sm font-bold">
          <Copy>Menu presentation</Copy>
        </h2>

        <Segments
          label="Menu layout"
          value={t.layout}
          options={["grid", "list"]}
          onChange={(layout) => set({ layout })}
        />

        <Segments
          label="Product photos"
          value={t.imageRatio}
          options={["square", "landscape", "wide"]}
          onChange={(imageRatio) => set({ imageRatio })}
        />

        <SourceLabel className="flex items-center justify-between gap-3 border p-3 text-sm">
          <Copy>Restaurant information</Copy>

          <SourceInput
            type="checkbox"
            checked={t.showRestaurantInfo}
            onChange={(e) => set({ showRestaurantInfo: e.target.checked })}
            className="h-4 w-4 accent-primary"
          />
        </SourceLabel>
      </section>

      <section className="space-y-4 border-t pt-6">
        <h2 className="text-sm font-bold">
          <Copy>Banner</Copy>
        </h2>

        <SourceLabel className="flex items-center justify-between border p-3 text-sm">
          <Copy>Show banner</Copy>

          <SourceInput
            type="checkbox"
            checked={t.showBanner}
            onChange={(e) => set({ showBanner: e.target.checked })}
            className="h-4 w-4 accent-primary"
          />
        </SourceLabel>

        <Range
          label="Banner height"
          value={t.bannerHeight}
          min={180}
          max={440}
          step={20}
          display={`${t.bannerHeight}px`}
          onChange={(bannerHeight) => set({ bannerHeight })}
        />

        <Range
          label="Image overlay"
          value={t.bannerOverlay}
          min={20}
          max={85}
          step={5}
          display={`${t.bannerOverlay}%`}
          onChange={(bannerOverlay) => set({ bannerOverlay })}
        />

        <Segments
          label="Banner text"
          value={t.bannerAlign}
          options={["left", "center"]}
          onChange={(bannerAlign) => set({ bannerAlign })}
        />
      </section>
    </>
  )
}

function FontSelect({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <SourceLabel className="block space-y-2 text-sm font-medium">
      <Copy>{label}</Copy>

      <SourceSelect
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border bg-background p-2"
      >
        <Copy>
          {FONTS.map((f) => (
            <SourceOption key={f} value={f}>
              <Copy>{f}</Copy>
            </SourceOption>
          ))}
        </Copy>
      </SourceSelect>
    </SourceLabel>
  )
}

function Range({
  label,
  value,
  min,
  max,
  step = 1,
  display,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  display: string
  onChange: (v: number) => void
}) {
  return (
    <SourceLabel className="block space-y-2">
      <span className="flex justify-between gap-2 text-sm">
        <span>
          <Copy>{label}</Copy>
        </span>

        <span className="text-muted-foreground tabular-nums">
          <Copy>{display}</Copy>
        </span>
      </span>

      <SourceInput
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </SourceLabel>
  )
}

function Segments<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: readonly T[]
  onChange: (v: T) => void
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">
        <Copy>{label}</Copy>
      </p>

      <div className="flex border" role="group" aria-label={label}>
        <Copy>
          {options.map((option) => (
            <Button
              key={option}
              aria-pressed={value === option}
              variant={value === option ? "secondary" : "ghost"}
              size="sm"
              className="min-w-0 flex-1 px-2 capitalize"
              onClick={() => onChange(option)}
            >
              <Copy>{option}</Copy>
            </Button>
          ))}
        </Copy>
      </div>
    </div>
  )
}

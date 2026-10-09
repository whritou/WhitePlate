"use client"
import { SourceModal } from "@/components/ui/lovable-modal"
import { Copy } from "@/components/lovable/copy"
import {
  SourceButton,
  SourceInput,
  SourceLabel,
} from "@/components/ui/lovable-controls"
import { useState } from "react"
import { type StoreTheme } from "@/lib/lovable/storeTheme"
export function DnsModal({
  t,
  onClose,
  onSave,
}: {
  t: StoreTheme
  onClose: () => void
  onSave: (d: string, s: StoreTheme["domainStatus"]) => void
}) {
  const [domain, setDomain] = useState(t.domain || "order.maisonverte.fr")
  const [step, setStep] = useState<"enter" | "records" | "checking" | "done">(
    t.domainStatus === "connected" ? "done" : t.domain ? "records" : "enter"
  )
  const host = domain.split(".").length > 2 ? domain.split(".")[0] : "@"
  const verify = () => onSave(domain, "pending")

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4"
      onClick={onClose}
    >
      <SourceModal
        label="Connect your domain"
        onClose={() => onClose()}
        onClick={(e) => e.stopPropagation()}
        className="card-hard w-full max-w-lg bg-background"
      >
        <div className="flex items-center justify-between border-b px-5 py-3">
          <p className="font-display text-lg font-bold">
            <Copy>Connect your domain</Copy>
          </p>

          <SourceButton onClick={onClose} aria-label="Close">
            ✕
          </SourceButton>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex gap-2">
            <Copy>
              {["Domain", "DNS records", "Live"].map((s, i) => {
                const idx = { enter: 0, records: 1, checking: 1, done: 2 }[step]

                return (
                  <span
                    key={s}
                    className={`label-mono flex-1 border px-2 py-1.5 text-center ${i <= idx ? "bg-accent" : "text-muted-foreground"}`}
                  >
                    <Copy>{i + 1}</Copy>. <Copy>{s}</Copy>
                  </span>
                )
              })}
            </Copy>
          </div>

          <Copy>
            {step === "enter" && (
              <>
                <Field label="Your domain">
                  <SourceInput
                    value={domain}
                    onChange={(e) =>
                      setDomain(e.target.value.trim().toLowerCase())
                    }
                    className="w-full border bg-background px-3 py-2 text-sm"
                  />
                </Field>

                <SourceButton
                  disabled={!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain)}
                  onClick={() => setStep("records")}
                  className="btn-primary w-full justify-center disabled:opacity-40"
                >
                  <Copy>Continue</Copy>
                </SourceButton>
              </>
            )}
          </Copy>

          <Copy>
            {(step === "records" || step === "checking") && (
              <>
                <p className="text-sm text-muted-foreground">
                  <Copy>
                    Example records only. DNS verification and SSL require a
                    backend connection.
                  </Copy>
                </p>

                <table className="w-full border text-sm">
                  <thead>
                    <tr className="label-mono border-b bg-secondary text-left">
                      <th className="p-2">
                        <Copy>Type</Copy>
                      </th>

                      <th className="p-2">
                        <Copy>Name</Copy>
                      </th>

                      <th className="p-2">
                        <Copy>Value</Copy>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-bold">
                        <Copy>CNAME</Copy>
                      </td>

                      <td className="p-2">
                        <Copy>{host}</Copy>
                      </td>

                      <td className="p-2">
                        <Copy>stores.whiteplate.app</Copy>
                      </td>
                    </tr>

                    <tr>
                      <td className="p-2 font-bold">
                        <Copy>TXT</Copy>
                      </td>

                      <td className="p-2">
                        <Copy>_whiteplate</Copy>
                      </td>

                      <td className="p-2">
                        <Copy>wp-verify=8f2a91c</Copy>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="flex gap-2">
                  <SourceButton
                    onClick={() => setStep("enter")}
                    className="btn-ghost"
                  >
                    <Copy>Back</Copy>
                  </SourceButton>

                  <SourceButton
                    onClick={verify}
                    disabled
                    title="Backend connection required"
                    className="btn-primary flex-1 justify-center"
                  >
                    <Copy>
                      {step === "checking"
                        ? "Checking DNS…"
                        : "Verify connection"}
                    </Copy>
                  </SourceButton>
                </div>
              </>
            )}
          </Copy>

          <Copy>
            {step === "done" && (
              <div className="space-y-3 text-center">
                <p className="font-display text-2xl font-bold text-primary">
                  ● <Copy>{domain}</Copy>
                </p>

                <p className="text-sm text-muted-foreground">
                  <Copy>
                    Connected. SSL certificate issued — your store is live on
                    your own domain.
                  </Copy>
                </p>

                <div className="flex gap-2">
                  <SourceButton
                    onClick={() => {
                      onSave("", "none")
                      setStep("enter")
                    }}
                    className="btn-ghost"
                  >
                    <Copy>Remove</Copy>
                  </SourceButton>

                  <SourceButton
                    onClick={onClose}
                    className="btn-primary flex-1 justify-center"
                  >
                    <Copy>Done</Copy>
                  </SourceButton>
                </div>
              </div>
            )}
          </Copy>
        </div>
      </SourceModal>
    </div>
  )
}

export function ImagePick({
  label,
  value,
  onChange,
  wide,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  wide?: boolean
}) {
  const onFile = (f?: File) => {
    if (!f) return

    const reader = new FileReader()

    reader.onload = () => onChange(String(reader.result))
    reader.readAsDataURL(f)
  }

  return (
    <SourceLabel className="flex cursor-pointer items-center gap-3 border p-2 hover:bg-secondary">
      <span
        className={`flex shrink-0 items-center justify-center overflow-hidden border bg-secondary ${wide ? "h-10 w-20" : "h-10 w-10"}`}
      >
        <Copy>
          {value ? (
            <img
              src={value}
              alt=""
              className={`h-full w-full ${wide ? "object-cover" : "object-contain"}`}
            />
          ) : (
            <span className="text-muted-foreground">+</span>
          )}
        </Copy>
      </span>

      <span className="flex-1 text-sm font-semibold">
        <Copy>{label}</Copy>
      </span>

      <span className="label-mono text-muted-foreground">
        <Copy>Upload</Copy>
      </span>

      <SourceInput
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
    </SourceLabel>
  )
}

export function Group({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <p className="label-mono text-muted-foreground">
        <Copy>{title}</Copy>
      </p>

      <Copy>{children}</Copy>
    </section>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <SourceLabel className="block space-y-1.5">
      <span className="text-sm font-semibold">
        <Copy>{label}</Copy>
      </span>

      <Copy>{children}</Copy>
    </SourceLabel>
  )
}

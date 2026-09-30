import "server-only"

const escapeHtml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;")

const localeFor = (request?: Request) => {
  try {
    return new URL(request?.headers.get("referer") ?? "http://localhost/en").pathname.startsWith("/fr/")
      ? "fr"
      : "en"
  } catch {
    return "en"
  }
}

export async function sendAuthEmail(to: string, url: string, kind: "verify" | "reset", request?: Request) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) throw new Error("Email delivery is not configured")

  const french = localeFor(request) === "fr"
  const copy = kind === "verify"
    ? french
      ? { subject: "Confirmez votre adresse e-mail WhitePlate", title: "Confirmez votre adresse", action: "Confirmer mon adresse", ignore: "Si vous n’avez pas créé de compte, ignorez ce message." }
      : { subject: "Verify your WhitePlate email", title: "Verify your email address", action: "Verify email", ignore: "If you did not create an account, you can ignore this email." }
    : french
      ? { subject: "Réinitialisez votre mot de passe WhitePlate", title: "Choisissez un nouveau mot de passe", action: "Réinitialiser mon mot de passe", ignore: "Si vous n’avez pas demandé cette réinitialisation, ignorez ce message." }
      : { subject: "Reset your WhitePlate password", title: "Choose a new password", action: "Reset password", ignore: "If you did not request a reset, you can ignore this email." }
  const safeUrl = escapeHtml(url)
  const result = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      subject: copy.subject,
      html: `<main style="font-family:Arial,sans-serif;max-width:560px;margin:40px auto;color:#24231f"><h1>${copy.title}</h1><p><a href="${safeUrl}" style="display:inline-block;padding:12px 18px;background:#a94b25;color:#fff;text-decoration:none">${copy.action}</a></p><p>${copy.ignore}</p></main>`,
      text: `${copy.title}\n\n${url}\n\n${copy.ignore}`,
    }),
    cache: "no-store",
  })
  if (!result.ok) throw new Error("Email delivery failed")
}

export function escapeEmailHtml(value: string) {
  return escapeHtml(value)
}

import "server-only"
import { deliverEmail } from "@/lib/api/email-delivery"
import type { InvitationEmail } from "@/types/email"

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")

const localeFor = (request?: Request) => {
  try {
    return new URL(
      request?.headers.get("referer") ?? "http://localhost/en"
    ).pathname.startsWith("/fr/")
      ? "fr"
      : "en"
  } catch {
    return "en"
  }
}

export async function sendAuthEmail(
  to: string,
  url: string,
  kind: "verify" | "reset",
  request?: Request
) {
  const french = localeFor(request) === "fr"
  const copy =
    kind === "verify"
      ? french
        ? {
            subject: "Confirmez votre adresse e-mail WhitePlate",
            title: "Confirmez votre adresse",
            action: "Confirmer mon adresse",
            ignore: "Si vous n’avez pas créé de compte, ignorez ce message.",
          }
        : {
            subject: "Verify your WhitePlate email",
            title: "Verify your email address",
            action: "Verify email",
            ignore:
              "If you did not create an account, you can ignore this email.",
          }
      : french
        ? {
            subject: "Réinitialisez votre mot de passe WhitePlate",
            title: "Choisissez un nouveau mot de passe",
            action: "Réinitialiser mon mot de passe",
            ignore:
              "Si vous n’avez pas demandé cette réinitialisation, ignorez ce message.",
          }
        : {
            subject: "Reset your WhitePlate password",
            title: "Choose a new password",
            action: "Reset password",
            ignore:
              "If you did not request a reset, you can ignore this email.",
          }
  const safeUrl = escapeHtml(url)
  const delivered = await deliverEmail({
    to,
    subject: copy.subject,
    html: `<main style="font-family:Arial,sans-serif;max-width:560px;margin:40px auto;color:#24231f"><h1>${copy.title}</h1><p><a href="${safeUrl}" style="display:inline-block;padding:12px 18px;background:#a94b25;color:#fff;text-decoration:none">${copy.action}</a></p><p>${copy.ignore}</p></main>`,
    text: `${copy.title}\n\n${url}\n\n${copy.ignore}`,
  })

  if (!delivered) throw new Error("Email delivery failed")
}

export function escapeEmailHtml(value: string) {
  return escapeHtml(value)
}

export async function sendInvitationEmail({
  to,
  token,
  locale,
}: InvitationEmail): Promise<boolean> {
  let url: URL

  try {
    const base = new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000")

    if (
      !["http:", "https:"].includes(base.protocol) ||
      base.username ||
      base.password
    )
      return false
    url = new URL(`/${locale}/invitations/accept`, base)
    url.searchParams.set("token", token)
  } catch {
    return false
  }

  const copy =
    locale === "fr"
      ? {
          subject: "Invitation à rejoindre une équipe WhitePlate",
          title: "Vous avez reçu une invitation",
          action: "Accepter l’invitation",
          text: "Ce lien est valable pendant sept jours.",
        }
      : {
          subject: "You’re invited to a WhitePlate team",
          title: "You have a team invitation",
          action: "Accept invitation",
          text: "This link expires in seven days.",
        }

  return deliverEmail({
    to,
    subject: copy.subject,
    html: `<main style="font-family:Arial,sans-serif;max-width:560px;margin:40px auto;color:#24231f"><h1>${copy.title}</h1><p><a href="${escapeHtml(url.toString())}" style="display:inline-block;padding:12px 18px;background:#a94b25;color:#fff;text-decoration:none">${copy.action}</a></p><p>${copy.text}</p></main>`,
    text: `${copy.title}\n\n${url}\n\n${copy.text}`,
  })
}

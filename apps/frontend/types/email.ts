export type EmailMessage = {
  to: string
  subject: string
  html: string
  text: string
}

export type InvitationEmail = { to: string; token: string; locale: "en" | "fr" }

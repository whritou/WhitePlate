import type { Metadata } from "next"
import { GlobalNotFoundContent } from "@/components/status/global-not-found-content"
import "./globals.css"

export const metadata: Metadata = {
  title: "404 | WhitePlate",
  description: "This WhitePlate page could not be found.",
}

export default function GlobalNotFound() {
  return (
    <html lang="en" className="global-not-found font-sans antialiased">
      <body>
        <GlobalNotFoundContent />
      </body>
    </html>
  )
}

"use client"

import { GlobalErrorContent } from "@/components/status/global-error-content"
import "./globals.css"

export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="en" className="light global-error font-sans antialiased">
      <body>
        <title>Error | WhitePlate</title>

        <GlobalErrorContent onRetry={retry} />
      </body>
    </html>
  )
}

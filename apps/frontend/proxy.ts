import { NextResponse, type NextRequest } from "next/server"
import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"
import { getStorefrontPreviewRewrite } from "./lib/storefront-preview-routing"

const intlMiddleware = createMiddleware(routing)

export default function proxy(request: NextRequest) {
  const preview = getStorefrontPreviewRewrite(
    request.headers.get("host"),
    request.nextUrl.pathname,
    process.env.STOREFRONT_PATH_BASE_DOMAIN
  )

  if (preview) {
    const destination = request.nextUrl.clone()

    destination.pathname = preview.rewritePath

    return NextResponse.rewrite(destination)
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
}

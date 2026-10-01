import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export function GET() {
  const issuer = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"

  return NextResponse.json(
    {
      issuer,
      jwks_uri: `${issuer.replace(/\/$/, "")}/api/auth/jwks`,
      response_types_supported: ["token"],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["RS256"],
    },
    { headers: { "Cache-Control": "public, max-age=300" } }
  )
}

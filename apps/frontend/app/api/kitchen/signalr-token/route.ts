import { auth } from "@/lib/auth"

const noStoreHeaders = {
  "Cache-Control": "no-store",
  Pragma: "no-cache",
  Vary: "Cookie, Origin",
}

export async function POST(request: Request): Promise<Response> {
  const origin = request.headers.get("origin")
  let trustedOrigin: string
  try {
    trustedOrigin = new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000").origin
  } catch {
    return Response.json({ error: "unavailable" }, { status: 503, headers: noStoreHeaders })
  }

  if (!origin || origin !== trustedOrigin)
    return Response.json({ error: "forbidden" }, { status: 403, headers: noStoreHeaders })

  try {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user.emailVerified)
      return Response.json({ error: "unauthorized" }, { status: 401, headers: noStoreHeaders })

    const { token } = await auth.api.getToken({ headers: request.headers })
    if (!token)
      return Response.json({ error: "unavailable" }, { status: 503, headers: noStoreHeaders })

    return Response.json({ accessToken: token }, { headers: noStoreHeaders })
  } catch {
    return Response.json({ error: "unavailable" }, { status: 503, headers: noStoreHeaders })
  }
}

import nextEnv from "@next/env"
import { betterAuth } from "better-auth"
import { jwt } from "better-auth/plugins"
import { PostgresDialect } from "kysely"
import { Pool } from "pg"
import { fileURLToPath } from "node:url"
import path from "node:path"

export async function issueApiToken(auth, email, password) {
  const response = await auth.api.signInEmail({
    body: { email, password },
    asResponse: true,
  })
  if (!response.ok) throw new Error("Better Auth sign-in failed")

  const cookies = response.headers
    .getSetCookie()
    .map((value) => value.split(";", 1)[0])
  if (!cookies.length)
    throw new Error("Better Auth did not return a session cookie")
  const headers = new Headers({ cookie: cookies.join("; ") })
  const session = await auth.api.getSession({ headers })
  if (!session?.user.emailVerified)
    throw new Error("The account must have a verified email")

  const result = await auth.api.getToken({ headers })
  if (!result?.token) throw new Error("Better Auth did not issue an API token")
  return result.token
}

async function main() {
  nextEnv.loadEnvConfig(process.cwd())
  const authUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
  const email = process.env.WHITEPLATE_DEV_EMAIL
  const password = process.env.WHITEPLATE_DEV_PASSWORD
  if (
    process.env.NODE_ENV === "production" ||
    new URL(authUrl).hostname !== "localhost"
  ) {
    throw new Error("This token command is only for local development")
  }
  if (
    !email ||
    !password ||
    !process.env.DATABASE_URL ||
    !process.env.BETTER_AUTH_SECRET
  ) {
    throw new Error(
      "Set WHITEPLATE_DEV_EMAIL, WHITEPLATE_DEV_PASSWORD, DATABASE_URL, and BETTER_AUTH_SECRET"
    )
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 })
  try {
    const auth = betterAuth({
      baseURL: authUrl,
      secret: process.env.BETTER_AUTH_SECRET,
      database: {
        dialect: new PostgresDialect({ pool }),
        type: "postgres",
        schemaName: "auth",
      },
      emailAndPassword: { enabled: true, requireEmailVerification: true },
      plugins: [
        jwt({
          jwks: {
            keyPairConfig: { alg: "RS256", modulusLength: 2048 },
            rotationInterval: 60 * 60 * 24 * 30,
            gracePeriod: 60 * 60 * 24 * 30,
          },
          jwt: {
            issuer: authUrl,
            audience: process.env.API_AUDIENCE ?? "whiteplate-api",
            expirationTime: "15m",
            definePayload: ({ user }) => ({
              email: user.email,
              email_verified: user.emailVerified,
            }),
            getSubject: ({ user }) => user.id,
          },
        }),
      ],
    })
    console.log(await issueApiToken(auth, email, password))
  } finally {
    await pool.end()
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(
      error instanceof Error ? error.message : "Failed to issue an API token"
    )
    process.exitCode = 1
  })
}

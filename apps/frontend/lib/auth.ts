import { betterAuth } from "better-auth"
import { dash } from "@better-auth/infra"
import { jwt } from "better-auth/plugins"
import { nextCookies } from "better-auth/next-js"
import { Pool } from "pg"
import { PostgresDialect } from "kysely"
import { sendAuthEmail } from "@/lib/email"
import { createAuthDatabaseConfig } from "@/lib/auth-database"

const authUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
const apiAudience = process.env.API_AUDIENCE ?? "whiteplate-api"
const databaseUrl = process.env.DATABASE_URL

if (process.env.NODE_ENV === "production") {
  const missing = [
    ["BETTER_AUTH_SECRET", process.env.BETTER_AUTH_SECRET],
    ["DATABASE_URL", databaseUrl],
    ["API_AUDIENCE", process.env.API_AUDIENCE],
    ["GOOGLE_CLIENT_ID", process.env.GOOGLE_CLIENT_ID],
    ["GOOGLE_CLIENT_SECRET", process.env.GOOGLE_CLIENT_SECRET],
    ["MICROSOFT_CLIENT_ID", process.env.MICROSOFT_CLIENT_ID],
    ["MICROSOFT_CLIENT_SECRET", process.env.MICROSOFT_CLIENT_SECRET],
    ["RESEND_API_KEY", process.env.RESEND_API_KEY],
    ["RESEND_FROM_EMAIL", process.env.RESEND_FROM_EMAIL],
    ["API_BASE_URL", process.env.API_BASE_URL],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length)
    throw new Error(
      `Missing authentication configuration: ${missing.join(", ")}`
    )
  if ((process.env.BETTER_AUTH_SECRET?.length ?? 0) < 32)
    throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters")
  if (!authUrl.startsWith("https://"))
    throw new Error("BETTER_AUTH_URL must use HTTPS in production")
  if (!process.env.API_BASE_URL?.startsWith("https://"))
    throw new Error("API_BASE_URL must use HTTPS in production")
}

const pool = new Pool(
  createAuthDatabaseConfig(
    databaseUrl ?? "postgres://localhost/whiteplate",
    process.env.DATABASE_SSL_CA
  )
)

export const auth = betterAuth({
  appName: "WhitePlate",
  baseURL: authUrl,
  basePath: "/api/auth",
  secret:
    process.env.BETTER_AUTH_SECRET ??
    "whiteplate-local-development-secret-change-before-production",
  trustedOrigins: [authUrl],
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-up/email": { window: 60, max: 5 },
      "/sign-in/email": { window: 60, max: 10 },
      "/request-password-reset": { window: 3600, max: 5 },
      "/send-verification-email": { window: 3600, max: 5 },
      "/sign-in/social": { window: 60, max: 10 },
    },
  },
  database: {
    dialect: new PostgresDialect({ pool }),
    type: "postgres",
    schemaName: "auth",
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }, request) => {
      await sendAuthEmail(user.email, url, "reset", request)
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: false,
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url }, request) => {
      await sendAuthEmail(user.email, url, "verify", request)
    },
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            requireEmailVerification: true,
          },
        }
      : {}),
    ...(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET
      ? {
          microsoft: {
            clientId: process.env.MICROSOFT_CLIENT_ID,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
            tenantId: process.env.MICROSOFT_TENANT_ID ?? "common",
            requireEmailVerification: true,
            prompt: "select_account" as const,
          },
        }
      : {}),
  },
  plugins: [
    ...(process.env.BETTER_AUTH_API_KEY
      ? [dash({ apiKey: process.env.BETTER_AUTH_API_KEY })]
      : []),
    jwt({
      jwks: {
        keyPairConfig: { alg: "RS256", modulusLength: 2048 },
        rotationInterval: 60 * 60 * 24 * 30,
        gracePeriod: 60 * 60 * 24 * 30,
      },
      jwt: {
        issuer: authUrl,
        audience: apiAudience,
        expirationTime: "15m",
        definePayload: ({ user }) => ({
          email: user.email,
          email_verified: user.emailVerified,
        }),
        getSubject: ({ user }) => user.id,
      },
    }),
    nextCookies(),
  ],
})

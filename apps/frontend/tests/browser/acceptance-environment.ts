const acceptanceDatabaseMessage =
  "Explicitly select WHITEPLATE_ACCEPTANCE_DATABASE=neon-test for test-only fixture mutations"

export function requireAcceptanceDatabase(): void {
  let databaseHost: string | null = null

  try {
    const databaseUrl = new URL(process.env.DATABASE_URL ?? "")

    if (
      databaseUrl.protocol === "postgres:" ||
      databaseUrl.protocol === "postgresql:"
    )
      databaseHost = databaseUrl.hostname
  } catch {
    databaseHost = null
  }

  if (
    process.env.WHITEPLATE_ACCEPTANCE_DATABASE !== "neon-test" ||
    !databaseHost?.endsWith(".neon.tech") ||
    process.env.NODE_ENV === "production"
  )
    throw new Error(acceptanceDatabaseMessage)
}

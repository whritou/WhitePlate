import type { PoolConfig } from "pg"

export function createAuthDatabaseConfig(
  databaseUrl: string,
  certificateAuthority?: string
): PoolConfig {
  const config: PoolConfig = {
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  }

  if (!certificateAuthority?.trim()) return config

  const url = new URL(databaseUrl)

  if (
    ["ssl", "sslmode", "sslcert", "sslkey", "sslrootcert"].some((key) =>
      url.searchParams.has(key)
    )
  ) {
    throw new Error(
      "Remove SSL parameters from DATABASE_URL when DATABASE_SSL_CA is configured"
    )
  }

  config.ssl = {
    ca: certificateAuthority.replace(/\\n/g, "\n"),
    rejectUnauthorized: true,
  }

  return config
}

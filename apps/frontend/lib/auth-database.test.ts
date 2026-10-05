import { describe, expect, it } from "vitest"
import { Client } from "pg"
import { createAuthDatabaseConfig } from "@/lib/auth-database"

describe("auth database TLS", () => {
  it("preserves existing connection URL configuration without a custom CA", () => {
    const config = createAuthDatabaseConfig(
      "postgres://user:password@database.example.test/whiteplate?sslmode=require"
    )

    expect(config.connectionString).toBe(
      "postgres://user:password@database.example.test/whiteplate?sslmode=require"
    )
    expect(config.ssl).toBeUndefined()
  })

  it("passes the custom CA and certificate verification to the actual PostgreSQL client", () => {
    const client = new Client(
      createAuthDatabaseConfig(
        "postgres://user:password@database.example.test:5432/whiteplate",
        "-----BEGIN CERTIFICATE-----\\nexample\\n-----END CERTIFICATE-----"
      )
    )

    expect(client.ssl).toEqual({
      ca: "-----BEGIN CERTIFICATE-----\nexample\n-----END CERTIFICATE-----",
      rejectUnauthorized: true,
    })
    expect(client.host).toBe("database.example.test")
    expect(client.database).toBe("whiteplate")
  })

  it.each(["ssl", "sslmode", "sslcert", "sslkey", "sslrootcert"])(
    "rejects %s URL options that would overwrite the custom CA",
    (option) => {
      expect(() =>
        createAuthDatabaseConfig(
          `postgres://user:password@database.example.test/whiteplate?${option}=disable`,
          "certificate"
        )
      ).toThrow("Remove SSL parameters from DATABASE_URL")
    }
  )
})

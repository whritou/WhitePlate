import { describe, expect, it } from "vitest"
import { Client } from "pg"
import {
  checkServerIdentity,
  type ConnectionOptions,
  type PeerCertificate,
} from "node:tls"
import { createAuthDatabaseConfig } from "@/lib/auth-database"

describe("auth database TLS", () => {
  it("verifies the configured IP when pg supplies localhost as the TLS hostname", () => {
    const client = new Client(
      createAuthDatabaseConfig(
        "postgres://user:password@204.168.231.15:5433/whiteplate",
        "certificate"
      )
    )
    const ssl = client.ssl as unknown as ConnectionOptions
    const verify = ssl.checkServerIdentity ?? checkServerIdentity

    expect(
      verify("localhost", {
        subjectaltname: "IP Address:204.168.231.15",
      } as PeerCertificate)
    ).toBeUndefined()
    expect(
      verify("localhost", {
        subjectaltname: "IP Address:204.168.231.16",
      } as PeerCertificate)?.message
    ).toContain("Hostname/IP does not match")
  })

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

    expect(client.ssl).toMatchObject({
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

import { notFound } from "next/navigation"
import { ParityFixture } from "./view"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  if (process.env.NODE_ENV === "production") notFound()

  const query = await searchParams

  return (
    <ParityFixture
      reference={query.reference === "1"}
      screen={query.screen}
      pricing={query.pricing === "1"}
    />
  )
}

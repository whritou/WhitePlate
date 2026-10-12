import { getPublicEstablishment } from "@/services/public-establishment"

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams
  const locale = query.get("locale") ?? "en"
  const result =
    query.getAll("locale").length <= 1 &&
    /^[a-zA-Z]{2,8}(?:-[a-zA-Z0-9]{1,8})*$/.test(locale) &&
    locale.length <= 128
      ? await getPublicEstablishment(
          request.headers.get("host"),
          locale,
          request.signal
        )
      : { ok: false, status: 400, error: "invalid" }

  return Response.json(result.ok && "data" in result ? result.data : result, {
    status: result.status,
    headers: { "Cache-Control": "no-store", Vary: "Host" },
  })
}

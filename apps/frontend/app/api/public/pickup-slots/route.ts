import { getPublicPickupSlots } from "@/services/public-pickup-slots"

export async function GET(request: Request) {
  const result = await getPublicPickupSlots(
    request.headers.get("host"),
    request.signal
  )

  return Response.json(result.ok && "data" in result ? result.data : result, {
    status: result.status,
    headers: { "Cache-Control": "no-store", Vary: "Host" },
  })
}

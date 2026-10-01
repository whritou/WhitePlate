import { toNextJsHandler } from "better-auth/next-js"
import { auth } from "@/lib/auth"

const handlers = toNextJsHandler(auth)

async function handle(
  request: Request,
  handler: (request: Request) => Promise<Response>
) {
  if (new URL(request.url).pathname === "/api/auth/token")
    return new Response(null, { status: 404 })

  return handler(request)
}

export const GET = (request: Request) => handle(request, handlers.GET)
export const POST = (request: Request) => handle(request, handlers.POST)

export async function readLimitedBody(
  request: Request,
  maximum: number
): Promise<Blob | null> {
  if (Number(request.headers.get("content-length")) > maximum || !request.body)
    return null

  const reader = request.body.getReader()
  const chunks: Uint8Array<ArrayBuffer>[] = []
  let size = 0

  try {
    while (true) {
      const { value, done } = await reader.read()

      if (done) break
      size += value.byteLength
      if (size > maximum) {
        await reader.cancel()

        return null
      }

      chunks.push(new Uint8Array(value))
    }

    return size ? new Blob(chunks) : null
  } catch {
    return null
  } finally {
    reader.releaseLock()
  }
}

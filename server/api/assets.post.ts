export default defineEventHandler(async (event) => {
  const { backendUrl } = useRuntimeConfig(event)

  const parts = await readMultipartFormData(event)
  const problem = validateUpload(parts)
  if (problem)
    throw createError({ statusCode: 400, statusMessage: problem })

  // Rebuild the multipart body for the upstream call.
  const form = new FormData()
  for (const part of parts!) {
    if (!part.name)
      continue
    if (part.filename) {
      // `new Uint8Array(...)` rather than the Buffer directly: a Node Buffer can sit on a
      // SharedArrayBuffer, which `BlobPart` does not accept. The copy narrows it back.
      form.append(part.name, new Blob([new Uint8Array(part.data)], { type: part.type }), part.filename)
    }
    else {
      form.append(part.name, part.data.toString('utf8'))
    }
  }

  const created = await $fetch<BackendAsset>('/v1/assets', {
    baseURL: backendUrl,
    method: 'POST',
    body: form,
  })
  return normalizeAsset(created)
})

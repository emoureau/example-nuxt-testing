// Nuxt auto-imports `BackendAsset`/`UiAsset` as globals inside the Nitro context, but this
// module is also imported straight from a plain-node unit test, where those globals do not
// exist. Importing them explicitly is what keeps the file testable outside the server.
import type { Buffer } from 'node:buffer'
import type { BackendAsset, UiAsset } from '../../shared/types/asset'

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function buildUpstreamQuery(query: Record<string, unknown>) {
  const params: Record<string, string> = {}
  const q = typeof query.q === 'string' ? query.q.trim() : ''
  const tag = typeof query.tag === 'string' ? query.tag.trim() : ''
  if (q)
    params.q = q
  if (tag)
    params.tag = tag.toLowerCase()
  return params
}

export function normalizeAsset(raw: BackendAsset): UiAsset {
  return {
    id: raw.id,
    title: raw.title,
    tags: raw.tags ?? [],
    filename: raw.filename,
    size: raw.size,
    url: `/api/assets/${raw.id}/raw`,
  }
}

interface Part { name?: string, filename?: string, type?: string, data: Buffer }

export function validateUpload(parts: Part[] | undefined): string | null {
  const file = parts?.find(p => p.name === 'file' && p.filename)
  if (!file)
    return 'A file is required'
  if (!ALLOWED_TYPES.includes(file.type ?? '')) {
    return `Unsupported file type: ${file.type ?? 'unknown'}`
  }
  if (file.data.length > MAX_UPLOAD_BYTES)
    return 'File is larger than 5MB'
  return null
}

import type { BackendAsset } from '../shared/types/asset'
import { Buffer } from 'node:buffer'
import { http, HttpResponse } from 'msw'

// 1×1 transparent PNG, so seeded rows render something
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)

const blobs = new Map<string, Uint8Array>([['seed-1', PIXEL], ['seed-2', PIXEL]])

export const store: BackendAsset[] = [
  { id: 'seed-1', title: 'Sunset over the pier', tags: ['landscape', 'orange'], filename: 'sunset.jpg', contentType: 'image/jpeg', size: 148233, createdAt: '2026-01-04T10:00:00Z' },
  { id: 'seed-2', title: 'Studio portrait', tags: ['portrait', 'studio'], filename: 'portrait.png', contentType: 'image/png', size: 92004, createdAt: '2026-02-11T09:30:00Z' },
]

export const handlers = [
  http.get('/v1/assets', ({ request }) => {
    const url = new URL(request.url)
    const q = (url.searchParams.get('q') ?? '').toLowerCase().trim()
    const tag = url.searchParams.get('tag')

    let items = store
    if (q) {
      items = items.filter(a =>
        a.title.toLowerCase().includes(q) || a.tags.some(t => t.includes(q)))
    }
    if (tag)
      items = items.filter(a => a.tags.includes(tag))

    return HttpResponse.json({ items, total: items.length })
  }),

  http.post('/v1/assets', async ({ request }) => {
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return HttpResponse.json({ message: 'file is required' }, { status: 400 })
    }

    const id = `a-${Date.now()}`
    blobs.set(id, new Uint8Array(await file.arrayBuffer()))

    const asset: BackendAsset = {
      id,
      title: String(form.get('title') || file.name),
      tags: String(form.get('tags') ?? '').split(',').map(t => t.trim()).filter(Boolean),
      filename: file.name,
      contentType: file.type,
      size: file.size,
      createdAt: new Date().toISOString(),
    }
    store.unshift(asset)
    return HttpResponse.json(asset, { status: 201 })
  }),

  http.get('/v1/assets/:id/raw', ({ params }) => {
    const bytes = blobs.get(String(params.id))
    if (!bytes)
      return new HttpResponse(null, { status: 404 })
    return new HttpResponse(bytes, { headers: { 'Content-Type': 'image/png' } })
  }),
]

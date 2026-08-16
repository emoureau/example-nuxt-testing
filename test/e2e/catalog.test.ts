import type { UiAsset } from '../../shared/types/asset'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

interface AssetList { items: UiAsset[], total: number }

describe('asset catalog', async () => {
  // Builds the app and boots a real Nitro server, so everything below goes over HTTP:
  // the Vue render, the server routes, and the mock backend from `global-setup.ts`.
  await setup({ server: true })

  it('renders the search page', async () => {
    expect(await $fetch('/')).toContain('Asset catalog')
  })

  it('renders the import page', async () => {
    expect(await $fetch('/import')).toContain('Import an asset')
  })

  it('proxies a search to the backend and reshapes the result', async () => {
    const res = await $fetch<AssetList>('/api/assets', { query: { q: 'sunset' } })
    expect(res.items).toHaveLength(1)
    expect(res.items[0]!.title).toBe('Sunset over the pier')
    // proved the normaliser ran: url points at us, not the backend
    expect(res.items[0]!.url).toBe('/api/assets/seed-1/raw')
  })

  it('forwards multipart uploads without losing anything', async () => {
    const body = new FormData()
    body.append('file', new File([new Uint8Array([1, 2, 3])], 'tiny.png', { type: 'image/png' }))
    body.append('title', 'Tiny test image')
    body.append('tags', 'test,generated')

    const created = await $fetch<UiAsset>('/api/assets', { method: 'POST', body })

    expect(created.title).toBe('Tiny test image')
    expect(created.filename).toBe('tiny.png') // filename survived the rebuild
    expect(created.tags).toEqual(['test', 'generated'])
  })

  it('finds an uploaded asset by its metadata', async () => {
    const res = await $fetch<AssetList>('/api/assets', { query: { q: 'tiny test' } })
    expect(res.items.some(a => a.title === 'Tiny test image')).toBe(true)
  })

  it('streams the bytes back through the raw proxy route', async () => {
    const res = await $fetch<Blob>('/api/assets/seed-1/raw', { responseType: 'blob' })
    expect(res.type).toContain('image/png')
    expect(res.size).toBeGreaterThan(0)
  })

  it('rejects an oversized upload at the proxy', async () => {
    const body = new FormData()
    body.append('file', new File([new Uint8Array(6 * 1024 * 1024)], 'huge.png', { type: 'image/png' }))

    await expect($fetch('/api/assets', { method: 'POST', body })).rejects.toMatchObject({
      status: 400,
    })
  })
})

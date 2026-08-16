import { Buffer } from 'node:buffer'
import { describe, expect, it } from 'vitest'
import { buildUpstreamQuery, normalizeAsset, validateUpload } from '../../server/utils/assets'

describe('buildUpstreamQuery', () => {
  it('drops empty and whitespace-only params', () => {
    expect(buildUpstreamQuery({ q: '   ', tag: '' })).toEqual({})
  })
  it('trims and lowercases tags', () => {
    expect(buildUpstreamQuery({ q: ' sunset ', tag: ' Landscape ' }))
      .toEqual({ q: 'sunset', tag: 'landscape' })
  })
  it('ignores non-string input', () => {
    expect(buildUpstreamQuery({ q: ['a', 'b'] })).toEqual({})
  })
})

describe('normalizeAsset', () => {
  it('points url at our own proxy route, not the backend', () => {
    const ui = normalizeAsset({
      id: 'x1',
      title: 'T',
      tags: ['a'],
      filename: 'f.png',
      contentType: 'image/png',
      size: 10,
      createdAt: '2026-01-01T00:00:00Z',
    })
    expect(ui.url).toBe('/api/assets/x1/raw')
  })
  it('defaults missing tags to an empty array', () => {
    const ui = normalizeAsset({ id: 'x', tags: undefined } as never)
    expect(ui.tags).toEqual([])
  })
})

describe('validateUpload', () => {
  type UploadPart = NonNullable<Parameters<typeof validateUpload>[0]>[number]

  const part = (over: Partial<UploadPart> = {}) => ({
    name: 'file',
    filename: 'a.png',
    type: 'image/png',
    data: Buffer.alloc(10),
    ...over,
  })

  it('requires a file part', () => {
    expect(validateUpload([])).toBe('A file is required')
  })
  it('rejects a disallowed type', () => {
    expect(validateUpload([part({ type: 'application/pdf' })]))
      .toMatch(/Unsupported file type/)
  })
  it('rejects oversized files', () => {
    expect(validateUpload([part({ data: Buffer.alloc(6 * 1024 * 1024) })]))
      .toMatch(/larger than/)
  })
  it('accepts a valid png', () => {
    expect(validateUpload([part()])).toBeNull()
  })
})

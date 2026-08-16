import { describe, expect, it } from 'vitest'
import { checkImage, formatBytes, parseTags } from '../../app/utils/files'

// File.size is read-only, so fake it rather than allocating megabytes
function fakeFile(name: string, type: string, size: number): File {
  const file = new File(['x'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('formatBytes', () => {
  it.each([
    [512, '512 B'],
    [2048, '2.0 KB'],
    [5 * 1024 * 1024, '5.0 MB'],
  ])('formats %i as %s', (input, expected) => {
    expect(formatBytes(input)).toBe(expected)
  })
})

describe('parseTags', () => {
  it('trims, lowercases, drops blanks and de-duplicates', () => {
    expect(parseTags('Sunset, sunset ,, LANDSCAPE ')).toEqual(['sunset', 'landscape'])
  })
})

describe('checkImage', () => {
  it('rejects a pdf', () => {
    expect(checkImage(fakeFile('doc.pdf', 'application/pdf', 100))).toMatch(/not a supported image/)
  })
  it('rejects an oversized png', () => {
    expect(checkImage(fakeFile('big.png', 'image/png', 6 * 1024 * 1024))).toMatch(/larger than 5.0 MB/)
  })
  it('accepts a small jpeg', () => {
    expect(checkImage(fakeFile('ok.jpg', 'image/jpeg', 2048))).toBeNull()
  })
})

import type { H3Event } from 'h3'
import { registerEndpoint, renderSuspended } from '@nuxt/test-utils/runtime'
import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/vue'
import { expect, it, vi } from 'vitest'
import AssetUploader from '~/components/AssetUploader.vue'

/**
 * `registerEndpoint` is not a real HTTP server — `$fetch` hands the body straight to an
 * h3 handler as the very object it was given, so nothing is ever serialised onto a wire.
 * That means there is no `content-type: multipart/form-data; boundary=…` header, and
 * `readMultipartFormData(event)` therefore returns `undefined` in these tests. Reach for
 * the untouched body instead. Whether the *real* multipart round-trip survives our proxy
 * is a question only a real server can answer — see `test/e2e/catalog.test.ts`.
 */
function receivedFormData(event: H3Event): FormData {
  const body = (event.node.req as unknown as { body?: unknown }).body
  if (!(body instanceof FormData))
    throw new TypeError(`expected a FormData body, got ${typeof body}`)
  return body
}

function imageFile(name = 'photo.png', type = 'image/png', size = 2048) {
  const file = new File(['binary'], name, { type })
  // File.size is read-only, so fake it rather than allocating megabytes
  Object.defineProperty(file, 'size', { value: size })
  return file
}

/**
 * `applyAccept: false` because the file input carries `accept="image/*"`, and user-event
 * honours it: with the default settings it silently drops the .pdf and fires no `change`
 * event at all, so the component never sees the file it is supposed to reject. Turning
 * the filter off is what lets us test *our* validation rather than the browser's.
 */
function pickFiles() {
  return userEvent.setup({ applyAccept: false })
}

it('rejects a non-image without making a request', async () => {
  const hits = vi.fn()
  registerEndpoint('/api/assets', { method: 'POST', handler: () => {
    hits()
    return {}
  } })

  const user = pickFiles()
  await renderSuspended(AssetUploader)
  await user.upload(screen.getByLabelText('Image'), new File(['x'], 'doc.pdf', { type: 'application/pdf' }))

  expect(screen.getByRole('alert').textContent).toMatch(/not a supported image/)
  expect(hits).not.toHaveBeenCalled()
})

it('rejects an oversized image without making a request', async () => {
  const hits = vi.fn()
  registerEndpoint('/api/assets', { method: 'POST', handler: () => {
    hits()
    return {}
  } })

  const user = pickFiles()
  await renderSuspended(AssetUploader)
  await user.upload(screen.getByLabelText('Image'), imageFile('big.png', 'image/png', 6 * 1024 * 1024))

  expect(screen.getByRole('alert').textContent).toMatch(/larger than/)
  expect(hits).not.toHaveBeenCalled()
})

it('sends file, title and parsed tags as form data', async () => {
  let received: FormData | undefined

  registerEndpoint('/api/assets', {
    method: 'POST',
    handler: (event) => {
      received = receivedFormData(event)
      return { id: 'new', title: 'Pier at dusk', tags: ['sunset'], url: '', filename: 'photo.png', size: 2048 }
    },
  })

  const user = pickFiles()
  await renderSuspended(AssetUploader)

  await user.upload(screen.getByLabelText('Image'), imageFile())
  await user.type(screen.getByLabelText('Title'), 'Pier at dusk')
  await user.type(screen.getByLabelText('Tags'), 'Sunset, sunset, PIER')
  await user.click(screen.getByRole('button', { name: 'Upload' }))

  expect(await screen.findByRole('status')).toBeTruthy()
  expect((received?.get('file') as File).name).toBe('photo.png')
  expect(received?.get('title')).toBe('Pier at dusk')
  expect(received?.get('tags')).toBe('sunset,pier') // trimmed, lowercased, de-duplicated
})

it('falls back to the filename when no title is typed', async () => {
  let received: FormData | undefined

  registerEndpoint('/api/assets', {
    method: 'POST',
    handler: (event) => {
      received = receivedFormData(event)
      return { id: 'new', title: 'photo.png', tags: [], url: '', filename: 'photo.png', size: 2048 }
    },
  })

  const user = pickFiles()
  await renderSuspended(AssetUploader)
  await user.upload(screen.getByLabelText('Image'), imageFile())
  await user.click(screen.getByRole('button', { name: 'Upload' }))

  expect(await screen.findByRole('status')).toBeTruthy()
  expect(received?.get('title')).toBe('photo.png')
})

it('announces the created asset and clears the form for the next one', async () => {
  const created = { id: 'new', title: 'photo.png', tags: ['pier'], url: '/api/assets/new/raw', filename: 'photo.png', size: 2048 }
  registerEndpoint('/api/assets', { method: 'POST', handler: () => created })

  // Vue turns an `uploaded` emit into an `onUploaded` prop, so a plain spy passed as a
  // prop is all it takes to observe it — no `wrapper.emitted()` needed.
  const onUploaded = vi.fn()
  const user = pickFiles()
  await renderSuspended(AssetUploader, { props: { onUploaded } })

  await user.upload(screen.getByLabelText('Image'), imageFile())
  await user.type(screen.getByLabelText('Tags'), 'pier')
  await user.click(screen.getByRole('button', { name: 'Upload' }))

  expect(await screen.findByRole('status')).toBeTruthy()
  expect(onUploaded).toHaveBeenCalledWith(created)
  expect((screen.getByLabelText('Tags') as HTMLInputElement).value).toBe('')
  expect(screen.getByRole('button', { name: 'Upload' })).toHaveProperty('disabled', true)
})

it('does not announce anything when the upload fails', async () => {
  registerEndpoint('/api/assets', {
    method: 'POST',
    handler: () => { throw createError({ statusCode: 500, statusMessage: 'Backend exploded' }) },
  })

  const onUploaded = vi.fn()
  const user = pickFiles()
  await renderSuspended(AssetUploader, { props: { onUploaded } })

  await user.upload(screen.getByLabelText('Image'), imageFile())
  await user.click(screen.getByRole('button', { name: 'Upload' }))

  await screen.findByRole('alert')
  expect(onUploaded).not.toHaveBeenCalled()
  expect(screen.queryByRole('status')).toBeNull()
})

it('shows the server message when the upload is refused', async () => {
  registerEndpoint('/api/assets', {
    method: 'POST',
    handler: () => { throw createError({ statusCode: 400, statusMessage: 'File is larger than 5 MB' }) },
  })

  const user = pickFiles()
  await renderSuspended(AssetUploader)
  await user.upload(screen.getByLabelText('Image'), imageFile())
  await user.click(screen.getByRole('button', { name: 'Upload' }))

  expect((await screen.findByRole('alert')).textContent).toMatch(/larger than 5 MB/)
})

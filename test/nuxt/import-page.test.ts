import { registerEndpoint, renderSuspended } from '@nuxt/test-utils/runtime'
import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/vue'
import { expect, it } from 'vitest'
import ImportPage from '~/pages/import.vue'

/**
 * The uploader has its own tests, and so does the card. This file tests the seam between
 * them — that the page listens to the emit and feeds the result to the grid — which is the
 * one thing neither component can prove on its own.
 */
it('adds a successful upload to the grid, newest first', async () => {
  const created = [
    { id: 'b', title: 'Second upload', tags: [], url: '/api/assets/b/raw', filename: 'b.png', size: 2048 },
    { id: 'a', title: 'First upload', tags: [], url: '/api/assets/a/raw', filename: 'a.png', size: 2048 },
  ]
  registerEndpoint('/api/assets', { method: 'POST', handler: () => created.pop() })

  const user = userEvent.setup({ applyAccept: false })
  await renderSuspended(ImportPage)

  expect(screen.queryByRole('list')).toBeNull()

  const picker = screen.getByLabelText('Image')
  await user.upload(picker, new File(['x'], 'a.png', { type: 'image/png' }))
  await user.click(screen.getByRole('button', { name: 'Upload' }))
  expect(await screen.findByText('First upload')).toBeTruthy()

  await user.upload(picker, new File(['x'], 'b.png', { type: 'image/png' }))
  await user.click(screen.getByRole('button', { name: 'Upload' }))
  expect(await screen.findByText('Second upload')).toBeTruthy()

  const headings = screen.getAllByRole('heading', { level: 3 })
  expect(headings.map(h => h.textContent?.trim())).toEqual(['Second upload', 'First upload'])
})

it('leaves the grid alone when the upload is refused', async () => {
  registerEndpoint('/api/assets', {
    method: 'POST',
    handler: () => { throw createError({ statusCode: 400, statusMessage: 'Nope' }) },
  })

  const user = userEvent.setup({ applyAccept: false })
  await renderSuspended(ImportPage)

  await user.upload(screen.getByLabelText('Image'), new File(['x'], 'a.png', { type: 'image/png' }))
  await user.click(screen.getByRole('button', { name: 'Upload' }))

  await screen.findByRole('alert')
  expect(screen.queryByRole('list')).toBeNull()
})

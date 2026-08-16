import { registerEndpoint, renderSuspended } from '@nuxt/test-utils/runtime'
import userEvent from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/vue'
import { getQuery } from 'h3'
import { expect, it, vi } from 'vitest'
import IndexPage from '~/pages/index.vue'

function asset(over = {}) {
  return {
    id: '1',
    title: 'Sunset over the pier',
    tags: ['landscape'],
    filename: 'sunset.jpg',
    size: 148233,
    url: '/api/assets/v1/raw',
    ...over,
  }
}

it('shows the idle hint before anything is typed', async () => {
  registerEndpoint('/api/assets', () => ({ items: [], total: 0 }))
  await renderSuspended(IndexPage)
  expect(screen.getByText(/Search your assets/)).toBeTruthy()
})

it('renders results for a query', async () => {
  registerEndpoint('/api/assets', () => ({ items: [asset()], total: 1 }))

  const user = userEvent.setup()
  await renderSuspended(IndexPage)
  await user.type(screen.getByLabelText('Search assets'), 'sunset')

  // real 300ms debonuce; findBy* waits up to 1000ms by default
  expect(await screen.findByText('Sunset over the pier')).toBeTruthy()
})

it('distinguishes no-results from not-yet-searched', async () => {
  registerEndpoint('/api/assets', () => ({ items: [], total: 0 }))

  const user = userEvent.setup()
  await renderSuspended(IndexPage)
  await user.type(screen.getByLabelText('Search assets'), 'zzzz')

  expect(await screen.findByText(/No assets match/)).toBeTruthy()
})

it('surfaces an error when the proxy route fails', async () => {
  registerEndpoint('/api/assets', () => {
    throw createError({ status: 502, statusText: 'upstream down' })
  })

  const user = userEvent.setup()
  await renderSuspended(IndexPage)
  await user.type(screen.getByLabelText('Search assets'), 'sunset')

  expect(await screen.findByRole('alert')).toBeTruthy()
})

it('sends only one request for a burst of keystrokes', async () => {
  const hits = vi.fn()
  registerEndpoint('/api/assets', () => {
    hits()
    return { items: [], total: 0 }
  })

  const user = userEvent.setup()
  await renderSuspended(IndexPage)
  await user.type(screen.getByLabelText('Search assets'), 'sunset')

  await waitFor(() => expect(hits).toHaveBeenCalledTimes(1))
})

it('discards a stale response that lands after a newer one', async () => {
  let call = 0
  registerEndpoint('/api/assets', async (event) => {
    const q = String(getQuery(event).q)
    call++
    if (call === 1)
      await new Promise(r => setTimeout(r, 400))
    return { items: [asset({ id: q, title: `result for ${q}` })], total: 1 }
  })

  const user = userEvent.setup()
  await renderSuspended(IndexPage)
  const input = screen.getByLabelText('Search assets')

  await user.type(input, 'sun')
  await new Promise(r => setTimeout(r, 350)) // let the slow one start
  await user.type(input, 'set')

  expect(await screen.findByText('result for sunset')).toBeTruthy()
  await new Promise(r => setTimeout(r, 400)) // slow response lands here
  expect(screen.queryByText('result for sun')).toBeNull()
})

it('restores a search from the URL', async () => {
  registerEndpoint('/api/assets', () => ({ items: [asset()], total: 1 }))
  await renderSuspended(IndexPage, { route: '/?q=sunset' })
  expect(await screen.findByText('Sunset over the pier')).toBeTruthy()
})

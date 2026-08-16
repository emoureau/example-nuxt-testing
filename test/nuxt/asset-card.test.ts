import { renderSuspended } from '@nuxt/test-utils/runtime'
import { screen, within } from '@testing-library/vue'
import { expect, it } from 'vitest'
import AssetCard from '~/components/AssetCard.vue'
import AssetGrid from '~/components/AssetGrid.vue'

/**
 * A presentational component has no network and no state of its own, so the whole contract
 * is props in, DOM out — no `registerEndpoint`, no `userEvent`. It still needs
 * `renderSuspended` rather than plain `render`, because Nuxt UI's `UCard`/`UBadge` reach
 * for the Nuxt app instance the moment they mount.
 */
function asset(over: Partial<UiAsset> = {}): UiAsset {
  return {
    id: '1',
    title: 'Sunset over the pier',
    tags: ['landscape', 'orange'],
    filename: 'sunset.jpg',
    size: 148_233,
    url: '/api/assets/1/raw',
    ...over,
  }
}

it('shows the title, a human-readable size and every tag', async () => {
  await renderSuspended(AssetCard, { props: { asset: asset() } })

  expect(screen.getByRole('heading', { name: 'Sunset over the pier' })).toBeTruthy()
  expect(screen.getByText('144.8 KB')).toBeTruthy()
  expect(screen.getByText('landscape')).toBeTruthy()
  expect(screen.getByText('orange')).toBeTruthy()
})

it('labels the thumbnail with the title and points it at our own proxy route', async () => {
  await renderSuspended(AssetCard, { props: { asset: asset() } })

  const image = screen.getByRole('img', { name: 'Sunset over the pier' })
  expect(image.getAttribute('src')).toBe('/api/assets/1/raw')
})

it('renders an untagged asset without inventing a badge', async () => {
  await renderSuspended(AssetCard, { props: { asset: asset({ tags: [] }) } })

  expect(screen.getByRole('heading', { name: 'Sunset over the pier' })).toBeTruthy()
  expect(screen.queryByText('landscape')).toBeNull()
})

it('gives the grid one list item per asset, in the order it was handed', async () => {
  await renderSuspended(AssetGrid, {
    props: {
      assets: [
        asset({ id: 'a', title: 'First' }),
        asset({ id: 'b', title: 'Second' }),
      ],
    },
  })

  const items = screen.getAllByRole('listitem')
  expect(items).toHaveLength(2)
  expect(within(items[0]!).getByRole('heading').textContent).toContain('First')
  expect(within(items[1]!).getByRole('heading').textContent).toContain('Second')
})

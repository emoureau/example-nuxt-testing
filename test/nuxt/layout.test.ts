import { renderSuspended } from '@nuxt/test-utils/runtime'
import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/vue'
import { beforeEach, expect, it } from 'vitest'
import DefaultLayout from '~/layouts/default.vue'

beforeEach(() => {
  document.cookie = 'sidebar-open=; max-age=0'
})

/**
 * The layout is chrome, not a feature, so there is very little worth asserting about how it
 * looks — the tests below stick to the two things a user can actually break: the toggle and
 * the theme menu. Both are queried through their accessible names rather than their classes,
 * which is what lets these tests survive the next round of Tailwind churn.
 */
it('names the sidebar toggle and the settings button for screen readers', async () => {
  await renderSuspended(DefaultLayout)

  expect(screen.getByRole('button', { name: 'Toggle sidebar' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Settings' })).toBeTruthy()
})

it('links the nav at the two pages of the app', async () => {
  await renderSuspended(DefaultLayout)

  expect(screen.getByRole('link', { name: 'Search' }).getAttribute('href')).toBe('/')
  expect(screen.getByRole('link', { name: 'Import' }).getAttribute('href')).toBe('/import')
})

it('remembers a collapsed sidebar in a cookie', async () => {
  const user = userEvent.setup()
  await renderSuspended(DefaultLayout)

  await user.click(screen.getByRole('button', { name: 'Toggle sidebar' }))

  expect(document.cookie).toContain('sidebar-open=false')
})

/**
 * Nuxt UI renders menu content into a teleport target outside the component's own subtree,
 * so `container`-scoped queries would miss it entirely. `screen` searches the whole
 * document, which is the reason to reach for it by default in this codebase.
 */
it('ticks exactly one theme, and moves the tick to whichever is picked', async () => {
  const user = userEvent.setup()
  await renderSuspended(DefaultLayout)

  const openMenu = async () => {
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    return screen.findAllByRole('menuitemcheckbox')
  }

  const items = await openMenu()
  expect(items.map(i => i.textContent?.trim())).toEqual(['System', 'Light', 'Dark'])
  expect(items.filter(i => i.getAttribute('aria-checked') === 'true')).toHaveLength(1)

  await user.click(screen.getByRole('menuitemcheckbox', { name: 'Dark' }))

  const reopened = await openMenu()
  expect(reopened.find(i => i.getAttribute('aria-checked') === 'true')?.textContent?.trim()).toBe('Dark')
})

import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { debounce } from '../../app/utils/debounce'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

it('collapses a burst into one call with the last value', () => {
  const spy = vi.fn()
  const run = debounce(spy, 300)

  // eslint-disable-next-line style/max-statements-per-line
  run('s'); run('su'); run('sun'); run('sunset')
  expect(spy).not.toHaveBeenCalled()

  vi.advanceTimersByTime(300)
  expect(spy).toHaveBeenCalledOnce()
  expect(spy).toHaveBeenCalledWith('sunset')
})

it('cancel prevents a pending call', () => {
  const spy = vi.fn()
  const run = debounce(spy, 300)
  run('x')
  run.cancel()
  vi.advanceTimersByTime(500)
  expect(spy).not.toHaveBeenCalled()
})

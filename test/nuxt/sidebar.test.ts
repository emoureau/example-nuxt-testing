import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, expect, it } from 'vitest'
import { defineComponent } from 'vue'

/**
 * `useSidebarOpen` calls `useCookie`, which needs a Nuxt app instance and therefore cannot
 * be called from the body of a test. Mounting a throwaway component whose only job is to
 * run the composable and hand back its result is the general trick for testing any
 * composable that reaches for injected context.
 */
async function callInSetup<T>(composable: () => T) {
  let result!: T
  await mountSuspended(defineComponent({
    setup() {
      result = composable()
      return () => null
    },
  }))
  return result
}

// Every test in a file shares one `document`, so the cookie one test writes is still there
// for the next one — and 'defaults to open' would pass or fail depending on the order the
// tests happened to run in. State that outlives a test has to be torn down by hand.
beforeEach(() => {
  document.cookie = 'sidebar-open=; max-age=0'
})

it('defaults to open', async () => {
  const open = await callInSetup(useSidebarOpen)
  expect(open.value).toBe(true)
})

it('writes the preference through to the cookie', async () => {
  const open = await callInSetup(useSidebarOpen)

  open.value = false
  await nextTick()

  expect(document.cookie).toContain('sidebar-open=false')
})

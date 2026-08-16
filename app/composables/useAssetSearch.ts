export function useAssetSearch() {
  const route = useRoute()
  const router = useRouter()

  const term = ref(String(route.query.q ?? ''))
  const items = ref<UiAsset[]>([])
  const status = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
  const errorMessage = ref('')

  // Every request takes a ticket; only the newest one may write to state.
  let sequence = 0

  async function run(value: string) {
    const ticket = ++sequence
    const q = value.trim()

    if (!q) {
      items.value = []
      status.value = 'idle'
      return
    }

    status.value = 'pending'
    try {
      const res = await $fetch<{ items: UiAsset[] }>('/api/assets', { query: { q } })
      if (ticket !== sequence)
        return
      items.value = res.items
      status.value = 'success'
    }
    catch {
      if (ticket !== sequence)
        return
      errorMessage.value = 'Search is unavailable right now.'
      status.value = 'error'
    }
  }

  const search = debounce(run, 300)

  watch(term, (value) => {
    search(value)
    router.replace({ query: value.trim() ? { q: value.trim() } : {} })
  })

  onMounted(() => {
    if (term.value)
      run(term.value)
  })

  return { term, items, status, errorMessage }
}

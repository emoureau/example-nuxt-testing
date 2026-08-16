export function useAssetUpload() {
  const file = ref<File | null>(null)
  const title = ref('')
  const tags = ref('')
  const problem = ref('')
  const status = ref<'idle' | 'saving' | 'saved' | 'failed'>('idle')

  function select(next: File | null) {
    problem.value = next ? (checkImage(next) ?? '') : ''
    file.value = problem.value ? null : next
  }

  async function submit() {
    if (!file.value) {
      problem.value = 'Choose an image first'
      return null
    }

    status.value = 'saving'
    const body = new FormData()
    body.append('file', file.value)
    body.append('title', title.value.trim() || file.value.name)
    body.append('tags', parseTags(tags.value).join(','))

    try {
      const created = await $fetch<UiAsset>('/api/assets', { method: 'POST', body })
      status.value = 'saved'
      return created
    }
    catch (e: unknown) {
      problem.value = (e as { statusMessage?: string })?.statusMessage ?? 'Upload failed'
      status.value = 'failed'
      return null
    }
  }

  function reset() {
    file.value = null
    title.value = ''
    tags.value = ''
    problem.value = ''
    status.value = 'idle'
  }

  return { file, title, tags, problem, status, select, submit, reset }
}

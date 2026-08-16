<script setup lang="ts">
const emit = defineEmits<{ uploaded: [asset: UiAsset] }>()

const { file, title, tags, problem, status, select, submit, reset } = useAssetUpload()

// A file input's value cannot be assigned anything but the empty string, so clearing the
// picker after a successful upload has to go through the element itself — `reset()` only
// clears the composable's copy of it.
const input = useTemplateRef<HTMLInputElement>('input')

// Kept out of `status`, which goes back to 'idle' on reset: without a flag of its own the
// "Saved." line would vanish in the same tick it appeared.
const savedMessage = ref('')

function onPick(event: Event) {
  savedMessage.value = ''
  select((event.target as HTMLInputElement).files?.[0] ?? null)
}

async function onSubmit() {
  const created = await submit()
  if (!created)
    return

  savedMessage.value = `Saved “${created.title}”.`
  emit('uploaded', created)
  reset()
  if (input.value)
    input.value.value = ''
}
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
    <label for="file">Image</label>
    <input
      id="file"
      ref="input"
      type="file"
      accept="image/*"
      @change="onPick"
    >

    <label for="title">Title</label>
    <UInput id="title" v-model="title" placeholder="Defaults to the filename" />

    <label for="tags">Tags</label>
    <UInput id="tags" v-model="tags" placeholder="landscape, orange" />

    <p v-if="problem" role="alert" class="text-error">
      {{ problem }}
    </p>
    <p v-if="savedMessage" role="status" class="text-success">
      {{ savedMessage }}
    </p>

    <UButton
      type="submit"
      class="self-start"
      :loading="status === 'saving'"
      :disabled="!file || status === 'saving'"
    >
      Upload
    </UButton>
  </form>
</template>

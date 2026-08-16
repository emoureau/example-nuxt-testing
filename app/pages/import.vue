<script setup lang="ts">
const uploaded = ref<UiAsset[]>([])

function onUploaded(asset: UiAsset) {
  uploaded.value = [asset, ...uploaded.value]
}
</script>

<template>
  <UContainer class="py-10 flex flex-col gap-6 overflow-y-auto">
    <div>
      <h1 class="text-3xl font-semibold">
        Import an asset
      </h1>
      <p class="text-muted mt-1">
        JPEG, PNG, WebP or GIF, up to {{ formatBytes(MAX_UPLOAD_BYTES) }}.
      </p>
    </div>

    <AssetUploader class="max-w-md" @uploaded="onUploaded" />

    <template v-if="uploaded.length">
      <h2 class="eyebrow">
        Uploaded this session
      </h2>
      <AssetGrid :assets="uploaded" />
    </template>
  </UContainer>
</template>

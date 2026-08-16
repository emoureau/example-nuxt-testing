<script setup lang="ts">
const { term, items, status, errorMessage } = useAssetSearch()
</script>

<template>
  <UContainer class="py-10 flex flex-col gap-6 overflow-y-auto">
    <h1 class="text-3xl font-semibold">
      Asset catalog
    </h1>
    <AssetSearchBar v-model="term" class="max-w-md" />

    <p v-if="status === 'idle'">
      Search your assets by title or tag.
    </p>
    <p v-else-if="status === 'pending'" role="status">
      Searching…
    </p>
    <p v-else-if="status === 'error'" role="alert">
      {{ errorMessage }}
    </p>
    <p v-else-if="!items.length">
      No assets match “{{ term }}”.
    </p>
    <AssetGrid v-else :assets="items" />
  </UContainer>
</template>

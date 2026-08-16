<script setup lang="ts">
defineProps<{ asset: UiAsset }>()
</script>

<template>
  <UCard>
    <img :src="asset.url" :alt="asset.title" class="w-full h-32 object-cover rounded">
    <h3 class="font-medium mt-2">
      {{ asset.title }}
    </h3>
    <p class="text-sm text-muted">
      {{ formatBytes(asset.size) }}
    </p>
    <UBadge v-for="tag in asset.tags" :key="tag" variant="soft">
      {{ tag }}
    </UBadge>
  </UCard>
</template>

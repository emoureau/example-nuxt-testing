<script setup lang="ts">
defineProps<{ assets: UiAsset[] }>()
</script>

<template>
  <ul class="grid grid-cols-2 md:grid-cols-3 gap-4 list-none p-0">
    <li v-for="asset in assets" :key="asset.id">
      <AssetCard :asset="asset" />
    </li>
  </ul>
</template>

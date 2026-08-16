<script setup lang="ts">
const term = defineModel<string>({ required: true })
</script>

<template>
  <UInput
    v-model="term"
    type="search"
    icon="i-mdi-magnify"
    placeholder="Search by title or tag"
    aria-label="Search assets"
  />
</template>

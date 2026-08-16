<template>
  <UApp>
    <NuxtLoadingIndicator color="lime" />
    <a
      href="#maincontent"
      class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-(--ui-radius) focus:bg-default focus:px-4 focus:py-2 focus:text-highlighted focus:ring-2 focus:ring-primary"
    >
      Skip to main content
    </a>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

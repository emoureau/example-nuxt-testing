// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  runtimeConfig: {
    // NUXT_BACKEND_URL overrides this in every other environment
    backendUrl: 'http://localhost:9090',
  },
  modules: [
    '@nuxt/ui',
    '@nuxt/test-utils/module',
  ],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: '(㇏(•̀ᵥᵥ•́)ノ) Learning testing.....',
      htmlAttrs: {
        lang: 'en',
      },
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },
  icon: {
    mode: 'css',
    cssLayer: 'base',

    clientBundle: {
      // The default glob set is `{vue,jsx,tsx,md,mdc,mdx,yml,yaml}` — no `.ts`, so icon
      // names that only ever appear in a plain module were left out of the bundle and
      // had to be fetched at runtime. That covers the tone tables in `app/utils/tones.ts`
      // and the Nuxt UI icon overrides in `app/app.config.ts`, which between them are
      // most of the icons in the app.
      scan: {
        globInclude: ['**/*.{vue,jsx,tsx,ts,md,mdc,mdx,yml,yaml}'],
      },
      sizeLimitKb: 256,
    },
  },
})

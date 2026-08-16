import { defineVitestProject } from '@nuxt/test-utils/config'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      // `text` for the terminal, `html` to click through line by line, `lcov` for CI and
      // for editor gutter extensions.
      reporter: [['text', { skipFull: false }], 'html', 'lcov'],
      reportsDirectory: './coverage',
      // Without `include`, only files some test happened to import are counted — which
      // flatters the number by hiding everything nobody tests at all. Naming the source
      // tree instead means an untouched file shows up as a 0% row.
      include: ['app/**/*.{ts,vue}', 'server/**/*.ts', 'shared/**/*.ts'],
      exclude: [
        // Types and config compile away to nothing, so they have no statements to cover
        // and would sit at a permanent, meaningless 0%.
        'app/app.config.ts',
        'shared/types/**',
      ],
    },
    projects: [
      {
        test: {
          // Plain node, no DOM, no Nuxt: pure functions only. Milliseconds to run, so
          // this is the project the pre-commit hook can afford to run on every commit.
          name: 'unit',
          include: ['test/unit/*.{test,spec}.ts'],
          environment: 'node',
        },
      },
      {
        // A real build and a real Nitro server on a real port. Slow, and the only place
        // that can prove the multipart round-trip and the proxy routes actually work.
        test: {
          name: 'e2e',
          include: ['test/e2e/*.{test,spec}.ts'],
          environment: 'node',
          globalSetup: ['./test/e2e/global-setup.ts'],
          testTimeout: 30_000,
          hookTimeout: 120_000,
        },
      },
      // Components and composables in a simulated Nuxt app: auto-imports, `useRoute`,
      // `$fetch` and friends all resolve, and `registerEndpoint` stands in for the server.
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/*.{test,spec}.ts'],
          environment: 'nuxt',
        },
      }),
    ],
  },
})

# Learn to Frontend Test

A small Nuxt 4 asset catalog — search images, upload images — built as a place to learn
front-end testing on code that has real seams in it: a debounced search that can race itself,
a file upload with client *and* server validation, and a server layer that proxies and
reshapes a backend it does not own.

The app is the excuse. **The testing notes are the point: [`test/README.md`](test/README.md).**

## What it does

| Page | Route | Components |
| --- | --- | --- |
| Asset catalog | `/` | `AssetSearchBar`, `AssetGrid`, `AssetCard` |
| Import an asset | `/import` | `AssetUploader`, `AssetGrid`, `AssetCard` |

Search debounces at 300ms, mirrors the query into the URL (`/?q=sunset`, reload-safe), and
discards responses that arrive out of order. Upload validates type and size in the browser
*and* again on the server, then hands the file to the backend and shows what came back.

## Running it

Requires Node 20+.

```bash
npm install
npm run dev:mock
```

`dev:mock` runs two things at once: the Nuxt dev server on
[localhost:3000](http://localhost:3000), and a mock backend on port 9090 that stands in for
the real API. It ships with two seeded assets — search for `sunset`, `portrait`, `landscape`
or `studio` to see results, and anything else to see the empty state.

Uploads go to the mock's in-memory store, so they are searchable immediately and gone on
restart. Try a `.pdf` or a file over 5MB to see the validation paths.

To point at a real backend instead, copy `.env.example` to `.env`, set `NUXT_BACKEND_URL`,
and run `npm run dev` (without the mock).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Nuxt dev server only |
| `npm run dev:mock` | Nuxt dev server **and** the mock backend |
| `npm run mock` | The mock backend on its own (port 9090) |
| `npm run build` / `npm run preview` | Production build, then serve it |
| `npm test` | All three test projects |
| `npm run test:unit` | Pure-function tests (~0.3s) |
| `npm run test:nuxt` | Component and composable tests |
| `npm run test:e2e` | Real build, real server, real HTTP |
| `npm run test:watch` | Watch mode |
| `npm run test:coverage` | Coverage table + `coverage/index.html` |
| `npm run lint` / `npm run lint:fix` | ESLint (@antfu config) |
| `npm run typecheck` | `vue-tsc` across app, server, shared, tests and mock |

## Layout

```
app/
  components/    AssetCard, AssetGrid, AssetSearchBar, AssetUploader
  composables/   useAssetSearch (debounce + race guard), useAssetUpload, useSidebarOpen
  utils/         debounce, files (formatBytes, checkImage, parseTags)
  pages/         index.vue (search), import.vue (upload)
  layouts/       default.vue — sidebar shell and theme menu
server/
  api/           assets.get, assets.post, assets/[id]/raw.get — the proxy layer
  utils/         assets.ts — query building, normalising, upload validation
shared/types/    BackendAsset (what the backend sends) / UiAsset (what the app uses)
mock/            msw handlers + a standalone server, shared by dev and the e2e suite
test/            unit / nuxt / e2e — see test/README.md
```

The split between `BackendAsset` and `UiAsset` is deliberate: `normalizeAsset` rewrites every
image URL to point at our own `/api/assets/:id/raw` route rather than the backend, so the
browser never talks to the backend directly. That rewrite is one of the things the tests pin
down.

## Git hooks

`.husky/pre-commit` runs, in order:

1. `npx lint-staged` — `eslint --fix` over the staged files, re-staging what it fixes
2. `npm run typecheck`
3. `npm run test:unit`

The `nuxt` and `e2e` projects are deliberately not in the hook — between them they build the
app and boot a server, which is minutes rather than seconds. Run `npm test` before pushing.

Whole-project checks live in the hook rather than in `lint-staged.config.js` because
lint-staged appends the staged filenames to every command it runs, and `nuxt typecheck` does
not take file arguments.

To bypass once: `git commit --no-verify`, or `HUSKY=0 git commit`.

## Conventions

- ESLint is [@antfu/eslint-config](https://github.com/antfu/eslint-config): no semicolons,
  single quotes, 2-space indent. It also formats — there is no Prettier.
- `nuxt typecheck` covers `app/`, `server/`, `shared/` and `test/nuxt/` via Nuxt's generated
  tsconfigs, plus `mock/`, `test/unit/` and `test/e2e/` via `tsconfig.tooling.json`.
- Nuxt auto-imports everything under `app/composables/`, `app/utils/` and `shared/types/`, so
  most files have no import block. The exception is `server/utils/assets.ts`, which imports
  its types explicitly so a plain-node unit test can import it — see
  [Making code testable](test/README.md#making-code-testable).

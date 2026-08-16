# Testing notes

Everything in here was learned by breaking it. Each section names the mistake first, because
the mistake is the part that repeats.

- [The three projects](#the-three-projects)
- [Choosing a layer](#choosing-a-layer)
- [Querying the DOM](#querying-the-dom)
- [Rendering a Nuxt component](#rendering-a-nuxt-component)
- [Faking the network](#faking-the-network)
- [Driving the UI with user-event](#driving-the-ui-with-user-event)
- [Waiting for things](#waiting-for-things)
- [Testing composables](#testing-composables)
- [Test isolation](#test-isolation)
- [Fixtures](#fixtures)
- [Making code testable](#making-code-testable)
- [Coverage](#coverage)
- [The e2e harness](#the-e2e-harness)

## The three projects

`vitest.config.ts` defines three projects. They are separate because they need different
environments, and keeping them separate is what makes the fast ones fast.

| Project | Environment | Runs in | What it can prove |
| --- | --- | --- | --- |
| `unit` | `node` | ~0.3s | Pure functions: formatting, parsing, validation, timing |
| `nuxt` | `nuxt` (happy-dom + a simulated Nuxt app) | ~10s | Components and composables: rendering, events, state, error paths |
| `e2e` | `node` + a real built server | ~30s | The wire: HTTP, multipart, proxying, SSR output |

```bash
npm run test:unit      # the fast one — this is what pre-commit runs
npm run test:nuxt
npm run test:e2e
npm test               # all three
npm run test:watch     # all three, in watch mode
```

## Choosing a layer

The rule that has held up: **push a test as far down as it will go, then stop.**

`debounce` is timing logic with no DOM, so it is a unit test with fake timers and it runs in
a millisecond. `useAssetSearch` needs `useRoute` and `$fetch`, so it is a `nuxt` test. Whether
a multipart upload survives our proxy is a question about bytes on a wire, so it is an `e2e`
test and nothing else can answer it.

The corollary matters more: **a test at the wrong layer can be green and still be lying.**
`test/nuxt/upload.test.ts` cannot tell you the multipart body is well-formed, because in that
environment there is no multipart body at all (see below). The e2e test is what covers it.

## Querying the DOM

Query by what a user perceives — role, accessible name, label, visible text — not by class
or test id. Class names change every time the design does; `getByRole('button', { name:
'Upload' })` only breaks when the button actually breaks.

This has a real payoff beyond durability: it means **an untestable component is usually an
inaccessible one.** Every `getByLabelText('Image')` in `upload.test.ts` is only possible
because the input has a real `<label for>`, and the sidebar tests work because those
icon-only buttons carry `aria-label`.

Use `screen` rather than the object returned by `render`. Nuxt UI teleports menu and modal
content out of the component's own subtree into `#teleports`, so a container-scoped query
finds nothing — `test/nuxt/layout.test.ts` opens a dropdown and would fail without `screen`.

`within(element)` is the escape hatch when you do need to scope, e.g. asserting the order of
cards inside a grid in `test/nuxt/asset-card.test.ts`.

## Rendering a Nuxt component

Use `renderSuspended` (Testing Library) or `mountSuspended` (Vue Test Utils) from
`@nuxt/test-utils/runtime` — never plain `render`/`mount`. They wrap the component in a Nuxt
app so auto-imports, `useRoute`, `useCookie`, `$fetch` and Nuxt UI's injected config all
resolve, and they await `<Suspense>`, which is what an `async setup()` needs.

`renderSuspended(IndexPage, { route: '/?q=sunset' })` sets the initial route, which is how
`search.test.ts` tests restoring a query from the URL.

Emits arrive as props: `<AssetUploader @uploaded="…">` is observable by passing
`{ props: { onUploaded: vi.fn() } }`. No `wrapper.emitted()` required.

## Faking the network

`registerEndpoint(path, handler)` installs an h3 handler that `$fetch` will hit. It is scoped
to the test file and takes `{ method, handler }` when you need to distinguish GET from POST.

**It is not a real server.** `$fetch` hands the handler the very body object it was given —
nothing is ever serialised. Two consequences bit us:

1. There is no `content-type: multipart/form-data; boundary=…` header, so
   `readMultipartFormData(event)` returns `undefined`. To assert on what a component sent,
   read the untouched body off `event.node.req.body`, which is still the original `FormData`.
   See the `receivedFormData` helper in `upload.test.ts`.
2. Anything about serialisation, encoding or headers has to be tested in `e2e`.

A handler is also the cleanest request counter — `test/nuxt/search.test.ts` proves the
debounce collapses a burst of keystrokes into one request by counting calls with `vi.fn()`.

## Driving the UI with user-event

`userEvent` simulates what a browser does, not what an event handler expects, and the
difference is the whole point. `user.type()` fires a `keydown`/`keypress`/`input`/`keyup` per
character, which is what makes the debounce test meaningful.

The gotcha that cost the most time: **`user.upload()` honours the input's `accept`
attribute.** The file input has `accept="image/*"`, so user-event silently dropped the test's
`.pdf` and fired no `change` event at all — the component never saw the file it was supposed
to reject, and the assertion failed with a confusing "unable to find role=alert". The fix is
`userEvent.setup({ applyAccept: false })`, which is what lets us test *our* validation rather
than the browser's.

Always `await` a user-event call. Each one flushes the Vue update queue on the way out.

## Waiting for things

| Need | Use |
| --- | --- |
| It is there now | `getBy*` — throws immediately with a DOM dump |
| It is not there | `queryBy*` — returns `null` instead of throwing |
| It will be there soon | `await findBy*` — retries for up to 1s |
| Some non-DOM condition | `await waitFor(() => expect(…))` |

Never assert absence with `findBy*` and never assert presence with `queryBy*`.

**Do not use fake timers in the `nuxt` project.** user-event schedules its own timers, so
`vi.useFakeTimers()` deadlocks against it. That is precisely why `debounce` gets its own unit
test: the timing logic is verified there with fake timers, and the component tests just wait
out the real 300ms — comfortably inside `findBy*`'s 1s budget.

For a race, control the ordering from inside the handler rather than from the test. The
"discards a stale response" test in `search.test.ts` makes the *first* request sleep 400ms,
types more, and then asserts the slow answer never overwrites the fast one — which is exactly
the bug the sequence counter in `useAssetSearch` exists to prevent.

## Testing composables

A composable that touches injected context — `useCookie`, `useRoute`, `useState` — cannot be
called from a test body; there is no app instance there. Mount a throwaway component whose
only job is to run it and hand back the result:

```ts
async function callInSetup<T>(composable: () => T) {
  let result!: T
  await mountSuspended(defineComponent({
    setup() {
      result = composable()
      return () => null
    },
  }))
  return result
}
```

Writing this test is what revealed that `useSidebarOpen` does *not* return a shared ref —
every caller gets its own, and the cookie is the only shared thing. The doc comment on the
composable was wrong, and the test is what said so.

## Test isolation

Tests in one file share one `document`, so anything global outlives the test that set it.
`sidebar.test.ts` and `layout.test.ts` both clear the cookie in `beforeEach`; without that,
"defaults to open" passes or fails depending on the order the tests happened to run in —
the worst kind of failure, because it looks like flakiness rather than a missing teardown.

The same applies to the e2e project in the other direction: `catalog.test.ts` uploads an
asset and a later test searches for it. That shared state is deliberate — it is testing a
sequence — but it means those tests are order-dependent by design, which is worth a comment
rather than a surprise.

## Fixtures

Build objects with a function that takes overrides, so each test states only what it cares
about:

```ts
function asset(over: Partial<UiAsset> = {}): UiAsset {
  return { id: '1', title: 'Sunset over the pier', /* … */ ...over }
}
```

`File.size` is read-only, so faking an oversized file means `Object.defineProperty(file,
'size', { value: 6 * 1024 * 1024 })` rather than allocating six megabytes.

## Making code testable

`server/utils/assets.ts` originally relied on Nuxt's auto-imported `BackendAsset`/`UiAsset`
globals. Those globals only exist inside the Nitro context, so the moment `typecheck` covered
the unit test that imports the module directly, it failed. Importing the types explicitly is
what keeps a server util importable — and therefore unit-testable — outside the server.

This generalises: pure logic that lives in its own module, with explicit imports and no
framework globals, is testable in milliseconds. Logic embedded in an event handler needs a
whole server to reach. `buildUpstreamQuery`, `normalizeAsset` and `validateUpload` were pulled
out of the route handlers for exactly this reason, and the route handlers are three lines each
as a result.

`nuxt typecheck` only covers what the generated `.nuxt/tsconfig.*.json` files include, which
is `app/`, `server/`, `shared/` and `test/nuxt/`. `tsconfig.tooling.json` exists to bring
`mock/`, `test/unit/` and `test/e2e/` in too — otherwise a stale import in a test is invisible
until the test runs.

## Coverage

```bash
npm run test:coverage      # unit + nuxt, prints a table
open coverage/index.html   # click through line by line
```

The e2e project is excluded on purpose: it runs the app as a separate built process, which
v8 cannot instrument, so including it would add minutes and no data.

That is also why `server/api/*` and `app/app.vue` sit at 0% while being demonstrably
exercised — the e2e suite renders both pages and calls all three routes.
**The number is a map of which tests ran, not of which code works.** Read the report to find
the branch you forgot, not to chase a percentage.

The terminal table also elides fully-covered files unless the reporter is configured with
`skipFull: false`, which is why `vitest.config.ts` passes it explicitly — a table that only
lists problems hides the shape of the codebase.

## The e2e harness

`setup({ server: true })` builds the app and boots a real Nitro server. `test/e2e/global-setup.ts`
starts the mock backend that Nitro proxies to, once for the whole project.

That mock runs **in-process** rather than as a spawned `tsx mock/server.ts`. The spawned
version had to be raced against ("is it listening yet?") and killed reliably on the way out,
and when the port was already busy the readiness probe cheerfully succeeded against whatever
was already there — so the suite passed while testing someone else's data. Binding the port
directly turns that into a startup error. If you see

```
port 9090 is already in use — stop `npm run mock` before running the e2e tests
```

that is the guard working.

Teardown calls `closeAllConnections()` before `close()`, because Nuxt's test server holds
keep-alive connections open and `close()` alone never resolves.

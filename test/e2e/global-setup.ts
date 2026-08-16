import type { Server } from 'node:http'
import { createServer } from '@mswjs/http-middleware'
import { handlers } from '../../mock/handlers'

const PORT = 9090

/**
 * Vitest calls this once before the e2e project runs, and calls the returned function once
 * after it. The mock backend runs in *this* process rather than a spawned `tsx mock/server`:
 * a child process has to be raced against (is it listening yet?) and reliably killed on the
 * way out, and when the port turns out to be busy the readiness probe happily succeeds
 * against whatever was already there — so the suite passes while testing someone else's
 * data. Binding the port here makes that case a startup error instead of a silent pass.
 */
export async function setup() {
  const server = await new Promise<Server>((resolve, reject) => {
    const listening = createServer(...handlers).listen(PORT, () => resolve(listening))
    listening.once('error', (error: NodeJS.ErrnoException) => {
      reject(error.code === 'EADDRINUSE'
        ? new Error(`port ${PORT} is already in use — stop \`npm run mock\` before running the e2e tests`)
        : error)
    })
  })

  return () => new Promise<void>((resolve, reject) => {
    // Nuxt's test server keeps its connections alive; without this the close never
    // completes and Vitest hangs after the last assertion has already passed.
    server.closeAllConnections()
    server.close(error => error ? reject(error) : resolve())
  })
}

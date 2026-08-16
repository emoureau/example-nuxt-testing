import process from 'node:process'
import { createServer } from '@mswjs/http-middleware'
import { handlers } from './handlers'

const port = Number(process.env.MOCK_PORT ?? 9090)
createServer(...handlers).listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`mock backend listening on http://localhost:${port}`)
})

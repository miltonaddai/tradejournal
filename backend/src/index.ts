import 'dotenv/config'
import { getDataFileLabel } from './db/store.js'
import { ensureCandleIndex } from './lib/candleData.js'

void ensureCandleIndex()

const { default: app } = await import('./app.js')

const PORT = Number(process.env.PORT) || 3001
// There is no login, so only listen on loopback unless HOST says otherwise.
const HOST = process.env.HOST || '127.0.0.1'

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`)
  console.log(`Data store: ${getDataFileLabel()}`)
})

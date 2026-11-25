import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import accountsRoutes from './routes/accounts.js'
import tradesRoutes from './routes/trades.js'
import journalRoutes from './routes/journal.js'
import strategiesRoutes from './routes/strategies.js'
import usersRoutes from './routes/users.js'
import chartsRoutes from './routes/charts.js'

const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/accounts', accountsRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/trades', tradesRoutes)
app.use('/api/journal', journalRoutes)
app.use('/api/strategies', strategiesRoutes)
app.use('/api/charts', chartsRoutes)

export default app

import { Server } from 'colyseus'
import { WebSocketTransport } from '@colyseus/ws-transport'
import { createServer } from 'http'
import express from 'express'
import cors from 'cors'
import { GameRoom } from './rooms/GameRoom'

const port = Number(process.env.PORT) || 2567

const app = express()
app.use(cors())
app.use(express.json())

// Health check
app.get('/', (_req, res) => {
  res.json({ status: 'ok', game: 'CLAWS' })
})
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', game: 'CLAWS' })
})

const httpServer = createServer(app)

const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
})

gameServer.define('game', GameRoom)

gameServer.listen(port).then(() => {
  console.log(`CLAWS server listening on port ${port}`)
})

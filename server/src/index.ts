import { Server } from 'colyseus'
import { WebSocketTransport } from '@colyseus/ws-transport'
import { createServer, type IncomingMessage, type ServerResponse } from 'http'
import { GameRoom } from './rooms/GameRoom'

const port = Number(process.env.PORT) || 2567

// HTTP server with health check endpoint for Render
const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', game: 'CLAWS' }))
    return
  }
  res.writeHead(404)
  res.end()
})

const server = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
})

server.define('game', GameRoom)

server.listen(port).then(() => {
  console.log(`CLAWS server listening on port ${port}`)
})

import { Server } from 'colyseus'
import { WebSocketTransport } from '@colyseus/ws-transport'
import { createServer, type IncomingMessage, type ServerResponse } from 'http'
import { GameRoom } from './rooms/GameRoom'

const port = Number(process.env.PORT) || 2567

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// HTTP server with CORS + health check
const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS)
    res.end()
    return
  }

  // Health check
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { ...CORS_HEADERS, 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', game: 'CLAWS' }))
    return
  }

  // All other requests — add CORS headers (Colyseus matchmaking uses POST)
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    res.setHeader(k, v)
  }
})

const server = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
})

server.define('game', GameRoom)

server.listen(port).then(() => {
  console.log(`CLAWS server listening on port ${port}`)
})

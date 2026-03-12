import { createServer } from 'http'
import { WebSocketServer } from 'ws'
// @ts-expect-error — y-websocket ships CJS utils without types
import { setupWSConnection } from 'y-websocket/bin/utils'

const PORT = Number(process.env.PORT ?? 1234)

const server = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('collab-canvas ws server')
})

const wss = new WebSocketServer({ server })

wss.on('connection', (ws, req) => {
  setupWSConnection(ws, req)
})

server.listen(PORT, () => {
  console.log(`[server] y-websocket listening on ws://localhost:${PORT}`)
})

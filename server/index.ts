import { createServer, type IncomingMessage, type ServerResponse } from 'http'
import { WebSocketServer } from 'ws'
// @ts-expect-error — y-websocket ships CJS utils without types
import { setupWSConnection } from 'y-websocket/bin/utils'
import * as Y from 'yjs'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const PORT = Number(process.env.PORT ?? 1234)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.resolve(__dirname, '../dist')
const IS_PROD = fs.existsSync(DIST_DIR)

const DATA_DIR = path.resolve('./data')
fs.mkdirSync(DATA_DIR, { recursive: true })

// Per-doc debounce timers
const writeTimers = new Map<string, ReturnType<typeof setTimeout>>()

function docFilePath(docName: string): string {
  return path.join(DATA_DIR, `${docName}.bin`)
}

function scheduleWrite(docName: string, ydoc: Y.Doc): void {
  const existing = writeTimers.get(docName)
  if (existing !== undefined) clearTimeout(existing)
  const timer = setTimeout(() => {
    writeTimers.delete(docName)
    const state = Y.encodeStateAsUpdate(ydoc)
    fs.writeFile(docFilePath(docName), state, (err) => {
      if (err) console.error(`[persistence] failed to write "${docName}":`, err)
      else console.log(`[persistence] saved "${docName}" (${state.byteLength}b)`)
    })
  }, 500)
  writeTimers.set(docName, timer)
}

const persistence = {
  async bindState(docName: string, ydoc: Y.Doc): Promise<void> {
    try {
      const data = fs.readFileSync(docFilePath(docName))
      Y.applyUpdate(ydoc, data)
      console.log(`[persistence] restored "${docName}" (${data.byteLength}b)`)
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT')
        console.error(`[persistence] error reading "${docName}":`, err)
      else console.log(`[persistence] new room "${docName}"`)
    }
    ydoc.on('update', () => scheduleWrite(docName, ydoc))
  },
  async writeState(docName: string, ydoc: Y.Doc): Promise<void> {
    const existing = writeTimers.get(docName)
    if (existing !== undefined) { clearTimeout(existing); writeTimers.delete(docName) }
    const state = Y.encodeStateAsUpdate(ydoc)
    try {
      fs.writeFileSync(docFilePath(docName), state)
      console.log(`[persistence] flushed "${docName}" (${state.byteLength}b)`)
    } catch (err) { console.error(`[persistence] flush failed for "${docName}":`, err) }
  },
}

// ── Static file serving (production) ─────────────────────

const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
}

function serveStatic(req: IncomingMessage, res: ServerResponse): void {
  const url = req.url ?? '/'
  const urlPath = url.split('?')[0]
  let filePath = path.join(DIST_DIR, urlPath)

  // If no file extension, serve index.html (SPA fallback)
  if (!path.extname(filePath)) filePath = path.join(DIST_DIR, 'index.html')

  const ext = path.extname(filePath)
  const contentType = MIME[ext] ?? 'application/octet-stream'

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Any 404 → SPA index
      fs.readFile(path.join(DIST_DIR, 'index.html'), (_e, html) => {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(html)
      })
    } else {
      res.writeHead(200, { 'Content-Type': contentType })
      res.end(data)
    }
  })
}

// ── HTTP server ───────────────────────────────────────────

const server = createServer((req, res) => {
  if (IS_PROD) {
    serveStatic(req, res)
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('collab-canvas ws server (dev)')
  }
})

// ── WebSocket server ──────────────────────────────────────

const wss = new WebSocketServer({ noServer: true })

server.on('upgrade', (req, socket, head) => {
  // Accept WS on /ws/* (prod path via Vite proxy) and /* (direct dev connection)
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req)
  })
})

wss.on('connection', (ws, req) => {
  setupWSConnection(ws, req, { persistence })
})

server.listen(PORT, () => {
  console.log(`[server] listening on :${PORT} (${IS_PROD ? 'production' : 'dev'})`)
})

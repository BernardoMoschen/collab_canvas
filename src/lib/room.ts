import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import type { Shape } from '../types'

let _doc: Y.Doc | null = null
let _provider: WebsocketProvider | null = null
let _shapes: Y.Array<Y.Map<unknown>> | null = null

export function initRoom(roomId: string, userId: string, userName: string, userColor: string) {
  if (_provider) _provider.destroy()

  _doc = new Y.Doc()
  _shapes = _doc.getArray<Y.Map<unknown>>('shapes')

  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  const wsUrl = isDev
    ? `ws://${window.location.hostname}:1234`
    : `wss://${window.location.host}/ws`

  _provider = new WebsocketProvider(wsUrl, roomId, _doc)
  _provider.awareness.setLocalState({ id: userId, name: userName, color: userColor, cursor: null })

  return { doc: _doc, provider: _provider, shapes: _shapes }
}

export function getRoom() {
  if (!_doc || !_provider || !_shapes) throw new Error('Room not initialized')
  return { doc: _doc, provider: _provider, shapes: _shapes }
}

// ── Shape helpers ─────────────────────────────────────────

export function addShape(shape: Shape) {
  const { shapes } = getRoom()
  const yMap = new Y.Map<unknown>()
  for (const [k, v] of Object.entries(shape)) yMap.set(k, v)
  shapes.push([yMap])
}

export function updateShapeField(id: string, field: string, value: unknown) {
  const { shapes } = getRoom()
  const yMap = shapes.toArray().find((m) => m.get('id') === id)
  if (yMap) yMap.set(field, value)
}

export function deleteShape(id: string) {
  const { shapes } = getRoom()
  const arr = shapes.toArray()
  const idx = arr.findIndex((m) => m.get('id') === id)
  if (idx !== -1) shapes.delete(idx, 1)
}

export function yMapToShape(yMap: Y.Map<unknown>): Shape {
  return Object.fromEntries(yMap.entries()) as unknown as Shape
}

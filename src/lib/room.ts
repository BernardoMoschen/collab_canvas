import * as Y from 'yjs'
import { nanoid } from 'nanoid'
import { WebsocketProvider } from 'y-websocket'
import { initUndoManager } from './undoManager'
import type { Shape } from '../types'

let _doc: Y.Doc | null = null
let _provider: WebsocketProvider | null = null
let _shapes: Y.Array<Y.Map<unknown>> | null = null

export function initRoom(roomId: string, userId: string, userName: string, userColor: string) {
  if (_provider) _provider.destroy()

  _doc = new Y.Doc()
  _shapes = _doc.getArray<Y.Map<unknown>>('shapes')
  initUndoManager(_shapes)

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

export function deleteShapes(ids: string[]) {
  const { shapes, doc } = getRoom()
  doc.transact(() => {
    // Delete in reverse index order to avoid index shifting
    const arr = shapes.toArray()
    const indices = ids
      .map((id) => arr.findIndex((m) => m.get('id') === id))
      .filter((i) => i !== -1)
      .sort((a, b) => b - a)
    for (const idx of indices) shapes.delete(idx, 1)
  })
}

export function duplicateShapes(ids: string[], offsetX = 24, offsetY = 24): string[] {
  const { shapes } = getRoom()
  const arr = shapes.toArray()
  const newIds: string[] = []
  for (const id of ids) {
    const yMap = arr.find((m) => m.get('id') === id)
    if (!yMap) continue
    const newMap = new Y.Map<unknown>()
    const newId = nanoid()
    newIds.push(newId)
    yMap.forEach((value, key) => {
      if (key === 'id') newMap.set(key, newId)
      else if (key === 'x' || key === 'y') newMap.set(key, (value as number) + offsetX)
      else if (key === 'x1' || key === 'x2') newMap.set(key, (value as number) + offsetX)
      else if (key === 'y1' || key === 'y2') newMap.set(key, (value as number) + offsetY)
      else newMap.set(key, value)
    })
    shapes.push([newMap])
  }
  return newIds
}

export function moveToFront(id: string) {
  const { shapes, doc } = getRoom()
  const arr = shapes.toArray()
  const idx = arr.findIndex((m) => m.get('id') === id)
  if (idx === -1 || idx === arr.length - 1) return
  const yMap = arr[idx]
  doc.transact(() => {
    shapes.delete(idx, 1)
    shapes.push([yMap])
  })
}

export function moveToBack(id: string) {
  const { shapes, doc } = getRoom()
  const arr = shapes.toArray()
  const idx = arr.findIndex((m) => m.get('id') === id)
  if (idx <= 0) return
  const yMap = arr[idx]
  doc.transact(() => {
    shapes.delete(idx, 1)
    shapes.insert(0, [yMap])
  })
}

export function yMapToShape(yMap: Y.Map<unknown>): Shape {
  return Object.fromEntries(yMap.entries()) as unknown as Shape
}

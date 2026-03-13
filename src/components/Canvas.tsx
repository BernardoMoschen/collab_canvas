import { useRef, useState, useCallback, useEffect } from 'react'
import { Stage, Layer, Line, Rect, Ellipse, Group, Text, Shape as KonvaCustomShape } from 'react-konva'
import type Konva from 'konva'
import { nanoid } from 'nanoid'
import { useStore } from '../store'
import { useShapes } from '../hooks/useShapes'
import { useAwareness } from '../hooks/useAwareness'
import {
  addShape, updateShapeField, deleteShapes, duplicateShapes,
  moveToFront, moveToBack, getRoom,
} from '../lib/room'
import { ShapeNode } from './ShapeNode'
import { StickyEditor } from './StickyEditor'
import { TextEditor } from './TextEditor'
import type { Shape, StickyShape, TextShape, ImageShape } from '../types'
import type { ToolType } from '../types'

export const globalStageRef = { current: null as Konva.Stage | null }

const GRID_SIZE = 20

function snapVal(v: number, enabled: boolean) {
  if (!enabled) return v
  return Math.round(v / GRID_SIZE) * GRID_SIZE
}

export function Canvas() {
  const {
    tool, strokeColor, strokeWidth, stickyColor, fillColor,
    userId, selectedIds, setSelectedIds, toggleSelectedId,
    setTool, clipboard, setClipboard,
    gridEnabled, snapToGrid, readOnly,
  } = useStore()
  const shapes = useShapes()
  const cursors = useAwareness()

  const stageRef = useRef<Konva.Stage>(null)
  const [preview, setPreview] = useState<Shape | null>(null)
  const [lassoRect, setLassoRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; shapeId: string } | null>(null)
  const [chatting, setChatting] = useState(false)
  const [chatPos, setChatPos] = useState({ x: 0, y: 0 })

  const drawing = useRef(false)
  const lassoStart = useRef<{ x: number; y: number } | null>(null)
  const startPos = useRef<{ x: number; y: number } | null>(null)
  const pathPoints = useRef<number[]>([])
  const scaleRef = useRef<number>(1)
  const spacePressed = useRef(false)
  const shiftHeld = useRef(false)
  const panStart = useRef<{ x: number; y: number; stageX: number; stageY: number } | null>(null)
  const isPanning = useRef(false)
  const [, forceUpdate] = useState(0)

  // Editing state (outside react-konva tree)
  const [editingShape, setEditingShape] = useState<Shape | null>(null)
  const [editingScale, setEditingScale] = useState(1)
  const [editingPos, setEditingPos] = useState({ x: 0, y: 0 })

  useEffect(() => { globalStageRef.current = stageRef.current })

  const requestEdit = useCallback((shape: Shape) => {
    const stage = globalStageRef.current
    setEditingScale(stage?.scaleX() ?? 1)
    setEditingPos(stage ? { x: stage.x(), y: stage.y() } : { x: 0, y: 0 })
    setEditingShape(shape)
  }, [])

  const getPos = useCallback((): { x: number; y: number } | null => {
    const stage = stageRef.current
    if (!stage) return null
    const p = stage.getPointerPosition()
    if (!p) return null
    return {
      x: (p.x - stage.x()) / stage.scaleX(),
      y: (p.y - stage.y()) / stage.scaleY(),
    }
  }, [])

  // ── Zoom ──────────────────────────────────────────────────
  const onWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return
    const oldScale = scaleRef.current
    const pointer = stage.getPointerPosition()
    if (!pointer) return
    const scaleBy = 1.08
    const dir = e.evt.deltaY < 0 ? 1 : -1
    const newScale = dir > 0 ? Math.min(5, oldScale * scaleBy) : Math.max(0.1, oldScale / scaleBy)
    scaleRef.current = newScale
    const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale }
    stage.scale({ x: newScale, y: newScale })
    stage.position({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale })
    forceUpdate(n => n + 1)
  }, [])

  // ── Pointer Down ──────────────────────────────────────────
  const onPointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    if (readOnly) return
    const pos = getPos()
    if (!pos) return
    const stage = stageRef.current

    if (spacePressed.current) {
      if (!stage) return
      isPanning.current = true
      panStart.current = { x: e.evt.clientX, y: e.evt.clientY, stageX: stage.x(), stageY: stage.y() }
      return
    }

    if (tool === 'select') {
      const clickedOnStage = e.target === stage
      if (clickedOnStage) {
        if (!shiftHeld.current) setSelectedIds([])
        lassoStart.current = pos
      }
      return
    }

    drawing.current = true
    const sp = { x: snapVal(pos.x, snapToGrid), y: snapVal(pos.y, snapToGrid) }
    startPos.current = sp

    if (tool === 'pen') {
      pathPoints.current = [pos.x, pos.y]
      setPreview({ id: '__preview', type: 'path', points: [pos.x, pos.y], color: strokeColor, strokeWidth, userId })
    } else if (tool === 'rect') {
      setPreview({ id: '__preview', type: 'rect', x: sp.x, y: sp.y, width: 0, height: 0, color: strokeColor, fillColor, userId })
    } else if (tool === 'ellipse') {
      setPreview({ id: '__preview', type: 'ellipse', x: sp.x, y: sp.y, radiusX: 0, radiusY: 0, color: strokeColor, fillColor, userId })
    } else if (tool === 'sticky') {
      addShape({ id: nanoid(), type: 'sticky', x: sp.x - 80, y: sp.y - 50, width: 160, height: 120, content: 'Double-click to edit', color: '#1e293b', bgColor: stickyColor, userId })
      drawing.current = false
    } else if ((tool as string) === 'text') {
      addShape({ id: nanoid(), type: 'text', x: sp.x, y: sp.y, content: 'Text', fontSize: 16, color: strokeColor, userId } as unknown as Shape)
      drawing.current = false
    } else if ((tool as string) === 'arrow') {
      setPreview({ id: '__preview', type: 'arrow', x1: sp.x, y1: sp.y, x2: sp.x, y2: sp.y, color: strokeColor, strokeWidth, userId } as unknown as Shape)
    }
  }, [tool, strokeColor, strokeWidth, stickyColor, fillColor, userId, snapToGrid, readOnly, setSelectedIds, getPos])

  // ── Pointer Move ──────────────────────────────────────────
  const onPointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    const pos = getPos()
    if (!pos) return

    if (isPanning.current && panStart.current) {
      const stage = stageRef.current
      if (!stage) return
      const dx = e.evt.clientX - panStart.current.x
      const dy = e.evt.clientY - panStart.current.y
      stage.position({ x: panStart.current.stageX + dx, y: panStart.current.stageY + dy })
      forceUpdate(n => n + 1)
      return
    }

    getRoom().provider.awareness.setLocalStateField('cursor', pos)

    // Lasso
    if (lassoStart.current && tool === 'select') {
      setLassoRect({
        x: Math.min(pos.x, lassoStart.current.x),
        y: Math.min(pos.y, lassoStart.current.y),
        w: Math.abs(pos.x - lassoStart.current.x),
        h: Math.abs(pos.y - lassoStart.current.y),
      })
      return
    }

    if (!drawing.current || !startPos.current) return

    const sp = { x: snapVal(pos.x, snapToGrid), y: snapVal(pos.y, snapToGrid) }

    if (tool === 'pen') {
      pathPoints.current.push(pos.x, pos.y)
      setPreview((p) => p ? { ...(p as Shape), points: [...pathPoints.current] } : null)
    } else if (tool === 'rect') {
      const x = Math.min(sp.x, startPos.current.x)
      const y = Math.min(sp.y, startPos.current.y)
      setPreview((p) => p ? { ...(p as Shape), x, y, width: Math.abs(sp.x - startPos.current!.x), height: Math.abs(sp.y - startPos.current!.y) } : null)
    } else if (tool === 'ellipse') {
      const radiusX = Math.abs(sp.x - startPos.current.x) / 2
      const radiusY = Math.abs(sp.y - startPos.current.y) / 2
      setPreview((p) => p ? { ...(p as Shape), x: (sp.x + startPos.current!.x) / 2, y: (sp.y + startPos.current!.y) / 2, radiusX, radiusY } : null)
    } else if ((tool as string) === 'arrow') {
      setPreview((p) => p ? { ...(p as Shape), x2: sp.x, y2: sp.y } as unknown as Shape : null)
    }
  }, [tool, snapToGrid, getPos])

  // ── Pointer Up ────────────────────────────────────────────
  const onPointerUp = useCallback(() => {
    if (isPanning.current) { isPanning.current = false; panStart.current = null; return }

    // Lasso finish
    if (lassoStart.current) {
      if (lassoRect && (lassoRect.w > 4 || lassoRect.h > 4)) {
        const { x: lx, y: ly, w: lw, h: lh } = lassoRect
        const ids = shapes
          .filter((s) => {
            if (s.type === 'path') return false
            if (s.type === 'arrow') {
              const ax = Math.min(s.x1, s.x2); const ay = Math.min(s.y1, s.y2)
              const aw = Math.abs(s.x2 - s.x1); const ah = Math.abs(s.y2 - s.y1)
              return ax >= lx && ay >= ly && ax + aw <= lx + lw && ay + ah <= ly + lh
            }
            const rs = s as { x: number; y: number; width?: number; height?: number; radiusX?: number; radiusY?: number }
            const sx = rs.x - (rs.radiusX ?? 0); const sy = rs.y - (rs.radiusY ?? 0)
            const sw = rs.width ?? (rs.radiusX ?? 0) * 2; const sh = rs.height ?? (rs.radiusY ?? 0) * 2
            return sx >= lx && sy >= ly && sx + sw <= lx + lw && sy + sh <= ly + lh
          })
          .map((s) => s.id)
        if (shiftHeld.current) setSelectedIds([...new Set([...selectedIds, ...ids])])
        else setSelectedIds(ids)
      }
      lassoStart.current = null
      setLassoRect(null)
      return
    }

    if (!drawing.current || !preview) { drawing.current = false; return }
    drawing.current = false

    const shape = { ...preview, id: nanoid() }
    if (shape.type === 'rect' && (shape.width < 4 || shape.height < 4)) { setPreview(null); return }
    if (shape.type === 'ellipse' && (shape.radiusX < 4 || shape.radiusY < 4)) { setPreview(null); return }
    if (shape.type === 'path' && shape.points.length < 4) { setPreview(null); return }
    if ((shape as unknown as { type: string }).type === 'arrow') {
      const s = shape as unknown as { x1: number; y1: number; x2: number; y2: number }
      if (Math.abs(s.x2 - s.x1) < 4 && Math.abs(s.y2 - s.y1) < 4) { setPreview(null); return }
    }
    addShape(shape)
    setPreview(null)
    pathPoints.current = []
  }, [preview, lassoRect, shapes, selectedIds, setSelectedIds])

  // ── Context Menu ──────────────────────────────────────────
  const onContextMenu = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage || e.target === stage) return
    // Find shape id
    let node: Konva.Node | null = e.target as Konva.Node
    while (node && !node.id()) node = node.parent as Konva.Node | null
    const shapeId = node?.id() || (e.target as Konva.Node).getAttr('shapeId') as string
    if (!shapeId) return
    setContextMenu({ x: e.evt.clientX, y: e.evt.clientY, shapeId })
  }, [])

  // ── Keyboard ──────────────────────────────────────────────
  const handleKeyDown = useCallback(async (e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

    shiftHeld.current = e.shiftKey

    if (e.key === ' ') { spacePressed.current = true; return }

    // Delete
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
      deleteShapes(selectedIds)
      setSelectedIds([])
      return
    }

    // Arrow key nudge
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedIds.length > 0) {
      e.preventDefault()
      const delta = e.shiftKey ? 10 : 1
      const dx = e.key === 'ArrowLeft' ? -delta : e.key === 'ArrowRight' ? delta : 0
      const dy = e.key === 'ArrowUp' ? -delta : e.key === 'ArrowDown' ? delta : 0
      for (const id of selectedIds) {
        const s = shapes.find((s) => s.id === id)
        if (!s) continue
        if (s.type === 'path') continue
        if (s.type === 'arrow') {
          updateShapeField(id, 'x1', s.x1 + dx); updateShapeField(id, 'y1', s.y1 + dy)
          updateShapeField(id, 'x2', s.x2 + dx); updateShapeField(id, 'y2', s.y2 + dy)
        } else {
          updateShapeField(id, 'x', (s as { x: number }).x + dx)
          updateShapeField(id, 'y', (s as { y: number }).y + dy)
        }
      }
      return
    }

    // Ctrl shortcuts
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        const { undo } = await import('../lib/undoManager')
        undo(); return
      }
      if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault()
        const { redo } = await import('../lib/undoManager')
        redo(); return
      }
      if (e.key === 'c' && selectedIds.length > 0) {
        const copied = shapes.filter((s) => selectedIds.includes(s.id))
        setClipboard(copied); return
      }
      if (e.key === 'v' && clipboard) {
        const newIds = duplicateShapes(clipboard.map((s) => s.id))
        setSelectedIds(newIds); return
      }
      if (e.key === 'a') {
        e.preventDefault()
        setSelectedIds(shapes.map((s) => s.id)); return
      }
      return
    }

    // Cursor chat
    if (e.key === '/' && !chatting) {
      const stage = stageRef.current
      const p = stage?.getPointerPosition()
      setChatPos(p ? { x: p.x, y: p.y } : { x: window.innerWidth / 2, y: window.innerHeight / 2 })
      setChatting(true); return
    }

    // Grid toggle
    if (e.key === 'g') { useStore.getState().toggleGrid(); return }

    // Tool shortcuts
    const toolMap: Record<string, string> = { s: 'select', p: 'pen', r: 'rect', e: 'ellipse', n: 'sticky', t: 'text', a: 'arrow' }
    if (!e.altKey && toolMap[e.key]) setTool(toolMap[e.key] as ToolType)
  }, [selectedIds, shapes, setSelectedIds, setClipboard, clipboard, setTool, chatting])

  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    if (e.key === ' ') spacePressed.current = false
    shiftHeld.current = e.shiftKey
  }, [])

  // ── Image Drop ────────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file?.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const src = ev.target?.result as string
      const img = new window.Image()
      img.onload = () => {
        const stage = stageRef.current
        if (!stage) return
        const scale = stage.scaleX()
        const stagePos = stage.position()
        const x = (e.clientX - stagePos.x) / scale
        const y = (e.clientY - stagePos.y) / scale
        const maxW = 400
        const ratio = Math.min(1, maxW / img.naturalWidth)
        addShape({
          id: nanoid(), type: 'image',
          x: snapVal(x - (img.naturalWidth * ratio) / 2, snapToGrid),
          y: snapVal(y - (img.naturalHeight * ratio) / 2, snapToGrid),
          width: img.naturalWidth * ratio,
          height: img.naturalHeight * ratio,
          src, color: '#000', userId,
        } as ImageShape)
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }, [snapToGrid, userId])

  const getCursor = () => {
    if (spacePressed.current) return 'grab'
    if (tool === 'select') return 'default'
    return 'crosshair'
  }

  const previewAsAny = preview as unknown as { type: string; x1: number; y1: number; x2: number; y2: number }

  // Build onMove for a shape (handles multi-select bulk move)
  const buildOnMove = (shape: Shape) => (dx: number, dy: number) => {
    const idsToMove = selectedIds.includes(shape.id) ? selectedIds : [shape.id]
    for (const id of idsToMove) {
      const s = shapes.find((s) => s.id === id)
      if (!s || s.type === 'path') continue
      if (s.type === 'arrow') {
        updateShapeField(id, 'x1', s.x1 + dx); updateShapeField(id, 'y1', s.y1 + dy)
        updateShapeField(id, 'x2', s.x2 + dx); updateShapeField(id, 'y2', s.y2 + dy)
      } else {
        updateShapeField(id, 'x', (s as { x: number }).x + dx)
        updateShapeField(id, 'y', (s as { y: number }).y + dy)
      }
    }
  }

  return (
    <div
      className="w-full h-full outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      style={{ cursor: getCursor() }}
    >
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
        onContextMenu={onContextMenu}
        onPointerLeave={() => getRoom().provider.awareness.setLocalStateField('cursor', null)}
      >
        {/* Grid layer (screen-space dots) */}
        {gridEnabled && (
          <Layer listening={false}>
            <KonvaCustomShape
              listening={false}
              sceneFunc={(ctx) => {
                const stage = stageRef.current
                if (!stage) return
                const scale = stage.scaleX()
                if (scale < 0.25) return
                const px = stage.x(); const py = stage.y()
                const W = window.innerWidth; const H = window.innerHeight
                const startX = Math.floor(-px / scale / GRID_SIZE) * GRID_SIZE
                const startY = Math.floor(-py / scale / GRID_SIZE) * GRID_SIZE
                const endX = startX + W / scale + GRID_SIZE * 2
                const endY = startY + H / scale + GRID_SIZE * 2
                const r = Math.max(0.5, 1 / scale)
                ctx.fillStyle = '#94a3b8'
                ctx.beginPath()
                for (let x = startX; x <= endX; x += GRID_SIZE) {
                  for (let y = startY; y <= endY; y += GRID_SIZE) {
                    ctx.moveTo(x, y)
                    ctx.arc(x, y, r, 0, Math.PI * 2)
                  }
                }
                ctx.fill()
              }}
            />
          </Layer>
        )}

        {/* Shapes layer */}
        <Layer>
          {shapes.map((shape) => (
            <ShapeNode
              key={shape.id}
              shape={shape}
              isSelected={selectedIds.includes(shape.id)}
              tool={tool}
              onSelect={() => {
                if (tool !== 'select') return
                if (shiftHeld.current) toggleSelectedId(shape.id)
                else setSelectedIds([shape.id])
              }}
              onMove={buildOnMove(shape)}
              onContentChange={(content) => updateShapeField(shape.id, 'content', content)}
              onUpdate={(updates) => { for (const [k, v] of Object.entries(updates)) updateShapeField(shape.id, k, v) }}
              onEditRequest={requestEdit}
            />
          ))}

          {/* Lasso selection rect */}
          {lassoRect && lassoRect.w > 2 && lassoRect.h > 2 && (
            <Rect
              x={lassoRect.x} y={lassoRect.y}
              width={lassoRect.w} height={lassoRect.h}
              fill="rgba(99,102,241,0.06)"
              stroke="#6366f1"
              strokeWidth={1}
              dash={[6, 3]}
              listening={false}
            />
          )}

          {/* Drawing previews */}
          {preview?.type === 'path' && (
            <Line points={preview.points} stroke={preview.color} strokeWidth={preview.strokeWidth} lineCap="round" lineJoin="round" tension={0.4} />
          )}
          {preview?.type === 'rect' && (
            <Rect x={preview.x} y={preview.y} width={preview.width} height={preview.height} stroke={preview.color} strokeWidth={2} fill={preview.color + '22'} dash={[6, 3]} />
          )}
          {preview?.type === 'ellipse' && (
            <Ellipse x={preview.x} y={preview.y} radiusX={preview.radiusX} radiusY={preview.radiusY} stroke={preview.color} strokeWidth={2} fill={preview.color + '22'} dash={[6, 3]} />
          )}
          {preview && previewAsAny.type === 'arrow' && (
            <Line points={[previewAsAny.x1, previewAsAny.y1, previewAsAny.x2, previewAsAny.y2]} stroke={preview.color} strokeWidth={2} dash={[8, 4]} />
          )}
        </Layer>

        {/* Cursors layer */}
        <Layer listening={false}>
          {cursors.map(({ id, name, color, cursor, message, messageAt }) => {
            if (!cursor) return null
            const showMsg = message && messageAt && Date.now() - messageAt < 5000
            return (
              <Group key={id} x={cursor.x} y={cursor.y}>
                <Rect x={0} y={0} width={10} height={10} fill={color} cornerRadius={2} rotation={45} />
                <Rect x={12} y={-6} width={name.length * 7 + 8} height={18} fill={color} cornerRadius={4} />
                <Text text={name} fontSize={11} fill="#fff" x={16} y={-2} fontFamily="monospace" />
                {showMsg && (
                  <>
                    <Rect x={-4} y={-36} width={message!.length * 7 + 12} height={22} fill={color} cornerRadius={6} />
                    <Text text={message!} fontSize={12} fill="#fff" x={2} y={-30} fontFamily="sans-serif" />
                  </>
                )}
              </Group>
            )
          })}
        </Layer>
      </Stage>

      {/* Context menu (rendered outside Stage) */}
      {contextMenu && (
        <ContextMenuOverlay
          x={contextMenu.x}
          y={contextMenu.y}
          shapeId={contextMenu.shapeId}
          selectedIds={selectedIds}
          onClose={() => setContextMenu(null)}
          onDeleteSelected={() => { deleteShapes(selectedIds.length > 0 ? selectedIds : [contextMenu.shapeId]); setSelectedIds([]) }}
          onDuplicate={() => {
            const ids = selectedIds.length > 0 ? selectedIds : [contextMenu.shapeId]
            const newIds = duplicateShapes(ids)
            setSelectedIds(newIds)
          }}
          onBringToFront={() => {
            const ids = selectedIds.length > 0 ? selectedIds : [contextMenu.shapeId]
            ids.forEach(moveToFront)
          }}
          onSendToBack={() => {
            const ids = selectedIds.length > 0 ? selectedIds : [contextMenu.shapeId]
            ids.forEach(moveToBack)
          }}
        />
      )}

      {/* Cursor chat input */}
      {chatting && (
        <CursorChatInput
          x={chatPos.x}
          y={chatPos.y}
          onSend={(msg) => {
            try {
              getRoom().provider.awareness.setLocalStateField('message', msg)
              getRoom().provider.awareness.setLocalStateField('messageAt', Date.now())
              setTimeout(() => {
                try { getRoom().provider.awareness.setLocalStateField('message', null) } catch {}
              }, 5000)
            } catch {}
            setChatting(false)
          }}
          onClose={() => setChatting(false)}
        />
      )}

      {/* Editors */}
      {editingShape?.type === 'sticky' && (
        <StickyEditor
          shape={editingShape as StickyShape}
          stageScale={editingScale}
          stagePos={editingPos}
          onCommit={(content) => { updateShapeField(editingShape.id, 'content', content); setEditingShape(null) }}
          onClose={() => setEditingShape(null)}
        />
      )}
      {editingShape?.type === 'text' && (
        <TextEditor
          shape={editingShape as TextShape}
          stageScale={editingScale}
          stagePos={editingPos}
          onCommit={(content) => { updateShapeField(editingShape.id, 'content', content); setEditingShape(null) }}
          onClose={() => setEditingShape(null)}
        />
      )}
    </div>
  )
}

// ── Inline sub-components (rendered in React DOM, not Konva) ──

function ContextMenuOverlay({
  x, y, shapeId: _shapeId, selectedIds, onClose,
  onDeleteSelected, onDuplicate, onBringToFront, onSendToBack,
}: {
  x: number; y: number; shapeId: string; selectedIds: string[]  // shapeId used by caller to build selectedIds fallback
  onClose: () => void
  onDeleteSelected: () => void
  onDuplicate: () => void
  onBringToFront: () => void
  onSendToBack: () => void
}) {
  const count = selectedIds.length > 1 ? selectedIds.length : 1
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', key) }
  }, [onClose])

  const ax = Math.min(x, window.innerWidth - 170)
  const ay = Math.min(y, window.innerHeight - 160)

  const btn = (label: string, icon: string, action: () => void, disabled = false) => (
    <button
      onClick={() => { action(); onClose() }}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
        padding: '6px 14px', background: 'transparent', border: 'none',
        cursor: disabled ? 'default' : 'pointer', fontSize: 13,
        color: disabled ? '#94a3b8' : '#334155', textAlign: 'left',
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = 'rgba(99,102,241,0.08)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      <span style={{ width: 18, fontSize: 14 }}>{icon}</span>{label}
    </button>
  )

  return (
    <div ref={ref} style={{
      position: 'fixed', left: ax, top: ay, zIndex: 2000,
      background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.14)', border: '1px solid rgba(0,0,0,0.08)',
      borderRadius: 10, padding: '4px 0', minWidth: 160,
    }}>
      {btn(`Delete${count > 1 ? ` (${count})` : ''}`, '🗑', onDeleteSelected)}
      {btn(`Duplicate${count > 1 ? ` (${count})` : ''}`, '⧉', onDuplicate)}
      <div style={{ height: 1, background: 'rgba(0,0,0,0.07)', margin: '3px 0' }} />
      {btn('Bring to front', '⬆', onBringToFront)}
      {btn('Send to back', '⬇', onSendToBack)}
    </div>
  )
}

function CursorChatInput({ x, y, onSend, onClose }: { x: number; y: number; onSend: (msg: string) => void; onClose: () => void }) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.focus() }, [])
  const ax = Math.min(x, window.innerWidth - 200)
  const ay = Math.min(y, window.innerHeight - 60)
  return (
    <div style={{ position: 'fixed', left: ax, top: ay - 40, zIndex: 2000 }}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, 80))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) { onSend(value.trim()); return }
          if (e.key === 'Escape') onClose()
        }}
        onBlur={() => { if (value.trim()) onSend(value.trim()); else onClose() }}
        placeholder="Chat…"
        style={{
          padding: '5px 12px', borderRadius: 20, border: '2px solid #6366f1',
          background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)',
          fontSize: 13, outline: 'none', width: 180,
          boxShadow: '0 4px 16px rgba(99,102,241,0.2)',
        }}
      />
    </div>
  )
}

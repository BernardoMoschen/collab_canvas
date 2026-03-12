import { useRef, useState, useCallback, useEffect } from 'react'
import { Stage, Layer, Line, Rect, Ellipse, Group, Text } from 'react-konva'
import type Konva from 'konva'
import { nanoid } from 'nanoid'
import { useStore } from '../store'
import { useShapes } from '../hooks/useShapes'
import { useAwareness } from '../hooks/useAwareness'
import { addShape, updateShapeField, deleteShape, getRoom } from '../lib/room'
import { ShapeNode } from './ShapeNode'
import type { Shape } from '../types'
import type { ToolType } from '../types'

export const globalStageRef = { current: null as Konva.Stage | null }

export function Canvas() {
  const { tool, strokeColor, strokeWidth, stickyColor, userId, selectedId, setSelectedId, setTool } =
    useStore()
  const shapes = useShapes()
  const cursors = useAwareness()

  const stageRef = useRef<Konva.Stage>(null)
  const [preview, setPreview] = useState<Shape | null>(null)
  const drawing = useRef(false)
  const startPos = useRef<{ x: number; y: number } | null>(null)
  const pathPoints = useRef<number[]>([])
  const scaleRef = useRef<number>(1)
  const spacePressed = useRef(false)
  const panStart = useRef<{ x: number; y: number; stageX: number; stageY: number } | null>(null)
  const isPanning = useRef(false)

  useEffect(() => {
    globalStageRef.current = stageRef.current
  })

  const getPos = useCallback((): { x: number; y: number } | null => {
    return stageRef.current?.getPointerPosition() ?? null
  }, [])

  const onWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return

    const oldScale = scaleRef.current
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const scaleBy = 1.08
    const direction = e.evt.deltaY < 0 ? 1 : -1
    const newScale = direction > 0
      ? Math.min(5, oldScale * scaleBy)
      : Math.max(0.1, oldScale / scaleBy)

    scaleRef.current = newScale

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    }

    stage.scale({ x: newScale, y: newScale })
    stage.position(newPos)
  }, [])

  const onPointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    const pos = getPos()
    if (!pos) return

    // Space+drag pan
    if (spacePressed.current) {
      const stage = stageRef.current
      if (!stage) return
      isPanning.current = true
      panStart.current = {
        x: e.evt.clientX,
        y: e.evt.clientY,
        stageX: stage.x(),
        stageY: stage.y(),
      }
      return
    }

    if (tool === 'select') {
      setSelectedId(null)
      return
    }

    drawing.current = true
    startPos.current = pos

    if (tool === 'pen') {
      pathPoints.current = [pos.x, pos.y]
      setPreview({ id: '__preview', type: 'path', points: [pos.x, pos.y], color: strokeColor, strokeWidth, userId })
    } else if (tool === 'rect') {
      setPreview({ id: '__preview', type: 'rect', x: pos.x, y: pos.y, width: 0, height: 0, color: strokeColor, userId })
    } else if (tool === 'ellipse') {
      setPreview({ id: '__preview', type: 'ellipse', x: pos.x, y: pos.y, radiusX: 0, radiusY: 0, color: strokeColor, userId })
    } else if (tool === 'sticky') {
      addShape({
        id: nanoid(),
        type: 'sticky',
        x: pos.x - 80,
        y: pos.y - 50,
        width: 160,
        height: 120,
        content: 'Double-click to edit',
        color: '#1e293b',
        bgColor: stickyColor,
        userId,
      })
      drawing.current = false
    } else if ((tool as string) === 'text') {
      addShape({
        id: nanoid(),
        type: 'text' as Shape['type'],
        x: pos.x,
        y: pos.y,
        content: 'Text',
        fontSize: 16,
        color: strokeColor,
        userId,
      } as unknown as Shape)
      drawing.current = false
    } else if ((tool as string) === 'arrow') {
      setPreview({
        id: '__preview',
        type: 'arrow' as Shape['type'],
        x1: pos.x,
        y1: pos.y,
        x2: pos.x,
        y2: pos.y,
        color: strokeColor,
        strokeWidth,
        userId,
      } as unknown as Shape)
    }
  }, [tool, strokeColor, strokeWidth, stickyColor, userId, setSelectedId, getPos])

  const onPointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    const pos = getPos()
    if (!pos) return

    // Space+drag pan
    if (isPanning.current && panStart.current) {
      const stage = stageRef.current
      if (!stage) return
      const dx = e.evt.clientX - panStart.current.x
      const dy = e.evt.clientY - panStart.current.y
      stage.position({
        x: panStart.current.stageX + dx,
        y: panStart.current.stageY + dy,
      })
      return
    }

    // Update cursor for all peers
    getRoom().provider.awareness.setLocalStateField('cursor', pos)

    if (!drawing.current || !startPos.current) return

    if (tool === 'pen') {
      pathPoints.current.push(pos.x, pos.y)
      setPreview((p) =>
        p ? { ...(p as Shape), points: [...pathPoints.current] } : null
      )
    } else if (tool === 'rect') {
      const x = Math.min(pos.x, startPos.current.x)
      const y = Math.min(pos.y, startPos.current.y)
      const width = Math.abs(pos.x - startPos.current.x)
      const height = Math.abs(pos.y - startPos.current.y)
      setPreview((p) => (p ? { ...(p as Shape), x, y, width, height } : null))
    } else if (tool === 'ellipse') {
      const radiusX = Math.abs(pos.x - startPos.current.x) / 2
      const radiusY = Math.abs(pos.y - startPos.current.y) / 2
      const x = (pos.x + startPos.current.x) / 2
      const y = (pos.y + startPos.current.y) / 2
      setPreview((p) => (p ? { ...(p as Shape), x, y, radiusX, radiusY } : null))
    } else if ((tool as string) === 'arrow') {
      setPreview((p) => (p ? { ...(p as Shape), x2: pos.x, y2: pos.y } as unknown as Shape : null))
    }
  }, [tool, getPos])

  const onPointerUp = useCallback(() => {
    if (isPanning.current) {
      isPanning.current = false
      panStart.current = null
      return
    }

    if (!drawing.current || !preview) {
      drawing.current = false
      return
    }
    drawing.current = false

    const shape = { ...preview, id: nanoid() }

    // Discard tiny shapes
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
  }, [preview])

  const handleKeyDown = useCallback(async (e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

    if (e.key === ' ') {
      spacePressed.current = true
      return
    }

    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
      deleteShape(selectedId)
      setSelectedId(null)
      return
    }

    // Undo/redo
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        const { undo } = await import('../lib/undoManager')
        undo()
        return
      }
      if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault()
        const { redo } = await import('../lib/undoManager')
        redo()
        return
      }
    }

    // Tool shortcuts
    const toolMap: Record<string, string> = {
      s: 'select',
      p: 'pen',
      r: 'rect',
      e: 'ellipse',
      n: 'sticky',
      t: 'text',
      a: 'arrow',
    }
    if (!e.ctrlKey && !e.metaKey && !e.altKey && toolMap[e.key]) {
      setTool(toolMap[e.key] as ToolType)
    }
  }, [selectedId, setSelectedId, setTool])

  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    if (e.key === ' ') {
      spacePressed.current = false
    }
  }, [])

  const getCursor = () => {
    if (spacePressed.current) return 'grab'
    if (tool === 'select') return 'default'
    return 'crosshair'
  }

  const previewAsAny = preview as unknown as { type: string; x1: number; y1: number; x2: number; y2: number }

  return (
    <div
      className="w-full h-full outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
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
        onPointerLeave={() =>
          getRoom().provider.awareness.setLocalStateField('cursor', null)
        }
      >
        {/* Shapes layer */}
        <Layer>
          {shapes.map((shape) => (
            <ShapeNode
              key={shape.id}
              shape={shape}
              isSelected={shape.id === selectedId}
              tool={tool}
              onSelect={() => tool === 'select' && setSelectedId(shape.id)}
              onMove={(dx, dy) => {
                if (shape.type === 'path') return
                if (shape.type === 'arrow') {
                  updateShapeField(shape.id, 'x1', shape.x1 + dx)
                  updateShapeField(shape.id, 'y1', shape.y1 + dy)
                  updateShapeField(shape.id, 'x2', shape.x2 + dx)
                  updateShapeField(shape.id, 'y2', shape.y2 + dy)
                  return
                }
                updateShapeField(shape.id, 'x', (shape as { x: number }).x + dx)
                updateShapeField(shape.id, 'y', (shape as { y: number }).y + dy)
              }}
              onContentChange={(content) => updateShapeField(shape.id, 'content', content)}
            />
          ))}

          {/* Drawing preview */}
          {preview && preview.type === 'path' && (
            <Line
              points={preview.points}
              stroke={preview.color}
              strokeWidth={preview.strokeWidth}
              lineCap="round"
              lineJoin="round"
              tension={0.4}
            />
          )}
          {preview && preview.type === 'rect' && (
            <Rect
              x={preview.x} y={preview.y}
              width={preview.width} height={preview.height}
              stroke={preview.color} strokeWidth={2}
              fill={preview.color + '22'}
              dash={[6, 3]}
            />
          )}
          {preview && preview.type === 'ellipse' && (
            <Ellipse
              x={preview.x} y={preview.y}
              radiusX={preview.radiusX} radiusY={preview.radiusY}
              stroke={preview.color} strokeWidth={2}
              fill={preview.color + '22'}
              dash={[6, 3]}
            />
          )}
          {preview && previewAsAny.type === 'arrow' && (
            <Line
              points={[previewAsAny.x1, previewAsAny.y1, previewAsAny.x2, previewAsAny.y2]}
              stroke={preview.color} strokeWidth={2} dash={[8, 4]}
            />
          )}
        </Layer>

        {/* Cursors layer (non-interactive) */}
        <Layer listening={false}>
          {cursors.map(({ id, name, color, cursor }) =>
            cursor ? (
              <Group key={id} x={cursor.x} y={cursor.y}>
                <Rect x={0} y={0} width={10} height={10} fill={color} cornerRadius={2} rotation={45} />
                <Rect x={12} y={-6} width={name.length * 7 + 8} height={18} fill={color} cornerRadius={4} />
                <Text text={name} fontSize={11} fill="#fff" x={16} y={-2} fontFamily="monospace" />
              </Group>
            ) : null
          )}
        </Layer>
      </Stage>
    </div>
  )
}

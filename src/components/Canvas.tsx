import { useRef, useState, useCallback } from 'react'
import { Stage, Layer, Line, Rect, Ellipse, Group, Text, Image } from 'react-konva'
import type Konva from 'konva'
import { nanoid } from 'nanoid'
import { useStore } from '../store'
import { useShapes } from '../hooks/useShapes'
import { useAwareness } from '../hooks/useAwareness'
import { addShape, updateShapeField, deleteShape, getRoom } from '../lib/room'
import { ShapeNode } from './ShapeNode'
import type { Shape } from '../types'

// Transparent 1x1 pixel for cursor layer (no visible image, just for positioning)
const _img = new window.Image()

export function Canvas() {
  const { tool, strokeColor, strokeWidth, stickyColor, userId, selectedId, setSelectedId } =
    useStore()
  const shapes = useShapes()
  const cursors = useAwareness()

  const stageRef = useRef<Konva.Stage>(null)
  const [preview, setPreview] = useState<Shape | null>(null)
  const drawing = useRef(false)
  const startPos = useRef<{ x: number; y: number } | null>(null)
  const pathPoints = useRef<number[]>([])

  const getPos = useCallback((): { x: number; y: number } | null => {
    return stageRef.current?.getPointerPosition() ?? null
  }, [])

  const onPointerDown = useCallback(() => {
    const pos = getPos()
    if (!pos) return

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
    }
  }, [tool, strokeColor, strokeWidth, stickyColor, userId, setSelectedId, getPos])

  const onPointerMove = useCallback(() => {
    const pos = getPos()
    if (!pos) return

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
    }
  }, [tool, getPos])

  const onPointerUp = useCallback(() => {
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

    addShape(shape)
    setPreview(null)
    pathPoints.current = []
  }, [preview])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
      deleteShape(selectedId)
      setSelectedId(null)
    }
  }, [selectedId, setSelectedId])

  return (
    <div
      className="w-full h-full outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{ cursor: tool === 'select' ? 'default' : 'crosshair' }}
    >
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
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

      {/* Suppress unused import warning — Image used for future avatar support */}
      <div style={{ display: 'none' }}>
        <Image image={_img} />
      </div>
    </div>
  )
}

import { useRef } from 'react'
import { Circle } from 'react-konva'
import type Konva from 'konva'
import type { RectShape, EllipseShape, StickyShape } from '../types'

type ResizableShape = RectShape | EllipseShape | StickyShape

interface HandleDef {
  getPos: (s: ResizableShape) => { x: number; y: number }
  apply: (s: ResizableShape, dx: number, dy: number) => Partial<ResizableShape>
}

const RECT_HANDLES: HandleDef[] = [
  // Corners
  {
    getPos: (s) => ({ x: (s as RectShape | StickyShape).x, y: (s as RectShape | StickyShape).y }),
    apply: (s, dx, dy) => {
      const rs = s as RectShape | StickyShape
      return { x: rs.x + dx, y: rs.y + dy, width: Math.max(20, rs.width - dx), height: Math.max(20, rs.height - dy) }
    },
  },
  {
    getPos: (s) => { const rs = s as RectShape | StickyShape; return { x: rs.x + rs.width, y: rs.y } },
    apply: (s, dx, dy) => {
      const rs = s as RectShape | StickyShape
      return { y: rs.y + dy, width: Math.max(20, rs.width + dx), height: Math.max(20, rs.height - dy) }
    },
  },
  {
    getPos: (s) => { const rs = s as RectShape | StickyShape; return { x: rs.x, y: rs.y + rs.height } },
    apply: (s, dx, dy) => {
      const rs = s as RectShape | StickyShape
      return { x: rs.x + dx, width: Math.max(20, rs.width - dx), height: Math.max(20, rs.height + dy) }
    },
  },
  {
    getPos: (s) => { const rs = s as RectShape | StickyShape; return { x: rs.x + rs.width, y: rs.y + rs.height } },
    apply: (s, dx, dy) => {
      const rs = s as RectShape | StickyShape
      return { width: Math.max(20, rs.width + dx), height: Math.max(20, rs.height + dy) }
    },
  },
  // Edge midpoints
  {
    getPos: (s) => { const rs = s as RectShape | StickyShape; return { x: rs.x + rs.width / 2, y: rs.y } },
    apply: (s, _dx, dy) => {
      const rs = s as RectShape | StickyShape
      return { y: rs.y + dy, height: Math.max(20, rs.height - dy) }
    },
  },
  {
    getPos: (s) => { const rs = s as RectShape | StickyShape; return { x: rs.x + rs.width / 2, y: rs.y + rs.height } },
    apply: (s, _dx, dy) => ({ height: Math.max(20, (s as RectShape | StickyShape).height + dy) }),
  },
  {
    getPos: (s) => { const rs = s as RectShape | StickyShape; return { x: rs.x, y: rs.y + rs.height / 2 } },
    apply: (s, dx, _dy) => {
      const rs = s as RectShape | StickyShape
      return { x: rs.x + dx, width: Math.max(20, rs.width - dx) }
    },
  },
  {
    getPos: (s) => { const rs = s as RectShape | StickyShape; return { x: rs.x + rs.width, y: rs.y + rs.height / 2 } },
    apply: (s, dx, _dy) => ({ width: Math.max(20, (s as RectShape | StickyShape).width + dx) }),
  },
]

const ELLIPSE_HANDLES: HandleDef[] = [
  // 4 corners of bounding box
  {
    getPos: (s) => { const e = s as EllipseShape; return { x: e.x - e.radiusX, y: e.y - e.radiusY } },
    apply: (s, dx, dy) => {
      const e = s as EllipseShape
      const newRX = Math.max(10, e.radiusX - dx / 2)
      const newRY = Math.max(10, e.radiusY - dy / 2)
      return { x: e.x + (e.radiusX - newRX), y: e.y + (e.radiusY - newRY), radiusX: newRX, radiusY: newRY }
    },
  },
  {
    getPos: (s) => { const e = s as EllipseShape; return { x: e.x + e.radiusX, y: e.y - e.radiusY } },
    apply: (s, dx, dy) => {
      const e = s as EllipseShape
      const newRX = Math.max(10, e.radiusX + dx / 2)
      const newRY = Math.max(10, e.radiusY - dy / 2)
      return { x: e.x - (e.radiusX - newRX), y: e.y + (e.radiusY - newRY), radiusX: newRX, radiusY: newRY }
    },
  },
  {
    getPos: (s) => { const e = s as EllipseShape; return { x: e.x - e.radiusX, y: e.y + e.radiusY } },
    apply: (s, dx, dy) => {
      const e = s as EllipseShape
      const newRX = Math.max(10, e.radiusX - dx / 2)
      const newRY = Math.max(10, e.radiusY + dy / 2)
      return { x: e.x + (e.radiusX - newRX), y: e.y - (e.radiusY - newRY), radiusX: newRX, radiusY: newRY }
    },
  },
  {
    getPos: (s) => { const e = s as EllipseShape; return { x: e.x + e.radiusX, y: e.y + e.radiusY } },
    apply: (s, dx, dy) => {
      const e = s as EllipseShape
      const newRX = Math.max(10, e.radiusX + dx / 2)
      const newRY = Math.max(10, e.radiusY + dy / 2)
      return { x: e.x - (e.radiusX - newRX), y: e.y - (e.radiusY - newRY), radiusX: newRX, radiusY: newRY }
    },
  },
]

interface ResizeHandlesProps {
  shape: ResizableShape
  onUpdate: (updates: Partial<ResizableShape>) => void
}

function DragHandle({
  x, y,
  shape,
  onUpdate,
  apply,
}: {
  x: number
  y: number
  shape: ResizableShape
  onUpdate: (updates: Partial<ResizableShape>) => void
  apply: HandleDef['apply']
}) {
  const dragStart = useRef<{ x: number; y: number } | null>(null)
  const initShape = useRef<ResizableShape | null>(null)

  return (
    <Circle
      x={x}
      y={y}
      radius={5}
      fill="white"
      stroke="#6366f1"
      strokeWidth={1.5}
      draggable
      onMouseEnter={(e) => { const stage = e.target.getStage(); if (stage) stage.container().style.cursor = 'nwse-resize' }}
      onMouseLeave={(e) => { const stage = e.target.getStage(); if (stage) stage.container().style.cursor = '' }}
      onDragStart={(e: Konva.KonvaEventObject<DragEvent>) => {
        dragStart.current = { x: e.target.x(), y: e.target.y() }
        initShape.current = shape
      }}
      onDragMove={(e: Konva.KonvaEventObject<DragEvent>) => {
        if (!dragStart.current || !initShape.current) return
        const dx = e.target.x() - dragStart.current.x
        const dy = e.target.y() - dragStart.current.y
        onUpdate(apply(initShape.current, dx, dy))
      }}
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
        if (!dragStart.current || !initShape.current) return
        const dx = e.target.x() - dragStart.current.x
        const dy = e.target.y() - dragStart.current.y
        onUpdate(apply(initShape.current, dx, dy))
        dragStart.current = null
        initShape.current = null
      }}
    />
  )
}

export function ResizeHandles({ shape, onUpdate }: ResizeHandlesProps) {
  const handles = shape.type === 'ellipse' ? ELLIPSE_HANDLES : RECT_HANDLES

  return (
    <>
      {handles.map((h, i) => {
        const pos = h.getPos(shape)
        return (
          <DragHandle
            key={i}
            x={pos.x}
            y={pos.y}
            shape={shape}
            onUpdate={onUpdate}
            apply={h.apply}
          />
        )
      })}
    </>
  )
}

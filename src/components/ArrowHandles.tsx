import { useRef } from 'react'
import { Circle } from 'react-konva'
import type Konva from 'konva'
import type { ArrowShape } from '../types'

interface Props {
  shape: ArrowShape
  onUpdate: (updates: Partial<ArrowShape>) => void
}

function EndpointHandle({
  x, y,
  onDrag,
}: {
  x: number
  y: number
  onDrag: (newX: number, newY: number) => void
}) {
  const dragStart = useRef<{ x: number; y: number; shapeX: number; shapeY: number } | null>(null)

  return (
    <Circle
      x={x}
      y={y}
      radius={6}
      fill="white"
      stroke="#6366f1"
      strokeWidth={2}
      draggable
      onMouseEnter={(e) => { const stage = e.target.getStage(); if (stage) stage.container().style.cursor = 'move' }}
      onMouseLeave={(e) => { const stage = e.target.getStage(); if (stage) stage.container().style.cursor = '' }}
      onDragStart={(e: Konva.KonvaEventObject<DragEvent>) => {
        dragStart.current = { x: e.target.x(), y: e.target.y(), shapeX: x, shapeY: y }
      }}
      onDragMove={(e: Konva.KonvaEventObject<DragEvent>) => {
        if (!dragStart.current) return
        const dx = e.target.x() - dragStart.current.x
        const dy = e.target.y() - dragStart.current.y
        onDrag(dragStart.current.shapeX + dx, dragStart.current.shapeY + dy)
      }}
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
        if (!dragStart.current) return
        const dx = e.target.x() - dragStart.current.x
        const dy = e.target.y() - dragStart.current.y
        onDrag(dragStart.current.shapeX + dx, dragStart.current.shapeY + dy)
        dragStart.current = null
      }}
    />
  )
}

export function ArrowHandles({ shape, onUpdate }: Props) {
  return (
    <>
      <EndpointHandle
        x={shape.x1}
        y={shape.y1}
        onDrag={(newX, newY) => onUpdate({ x1: newX, y1: newY })}
      />
      <EndpointHandle
        x={shape.x2}
        y={shape.y2}
        onDrag={(newX, newY) => onUpdate({ x2: newX, y2: newY })}
      />
    </>
  )
}

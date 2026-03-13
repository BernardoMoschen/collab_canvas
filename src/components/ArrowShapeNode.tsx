import { useRef } from 'react'
import { Arrow } from 'react-konva'
import type Konva from 'konva'
import type { ArrowShape, ToolType } from '../types'
import { ArrowHandles } from './ArrowHandles'

interface Props {
  shape: ArrowShape
  isSelected: boolean
  tool: ToolType
  onSelect: () => void
  onMove: (dx: number, dy: number) => void
  onUpdate: (updates: Partial<ArrowShape>) => void
}

export function ArrowShapeNode({ shape, isSelected, tool, onSelect, onMove, onUpdate }: Props) {
  const dragStart = useRef<{ x: number; y: number } | null>(null)

  const draggable = tool === 'select'

  return (
    <>
      <Arrow
        points={[shape.x1, shape.y1, shape.x2, shape.y2]}
        stroke={shape.color}
        strokeWidth={shape.strokeWidth}
        fill={shape.color}
        pointerLength={12}
        pointerWidth={10}
        shadowColor={isSelected ? '#6366f1' : undefined}
        shadowBlur={isSelected ? 10 : 0}
        draggable={draggable}
        onClick={onSelect}
        onDragStart={(e: Konva.KonvaEventObject<DragEvent>) => {
          dragStart.current = { x: e.target.x(), y: e.target.y() }
        }}
        onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
          if (!dragStart.current) return
          const dx = e.target.x() - dragStart.current.x
          const dy = e.target.y() - dragStart.current.y
          onMove(dx, dy)
          e.target.x(dragStart.current.x)
          e.target.y(dragStart.current.y)
          dragStart.current = null
        }}
      />
      {isSelected && tool === 'select' && (
        <ArrowHandles shape={shape} onUpdate={onUpdate} />
      )}
    </>
  )
}

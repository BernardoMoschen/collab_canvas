import { useRef } from 'react'
import { Text, Rect as KonvaRect } from 'react-konva'
import type Konva from 'konva'
import type { TextShape, ToolType } from '../types'

interface Props {
  shape: TextShape
  isSelected: boolean
  tool: ToolType
  onSelect: () => void
  onMove: (dx: number, dy: number) => void
  onContentChange: (content: string) => void
  onEditRequest: () => void
}

export function TextShapeNode({ shape, isSelected, tool, onSelect, onMove, onEditRequest }: Props) {
  const dragStart = useRef<{ x: number; y: number } | null>(null)

  const draggable = tool === 'select'

  // Approximate text dimensions for the selection highlight box
  const approxCharWidth = shape.fontSize * 0.6
  const textWidth = Math.max(shape.content.length * approxCharWidth, 20)
  const textHeight = shape.fontSize + 4

  return (
    <>
      {isSelected && (
        <KonvaRect
          x={shape.x - 2}
          y={shape.y - 2}
          width={textWidth + 4}
          height={textHeight + 4}
          fill="rgba(99,102,241,0.12)"
          stroke="#6366f1"
          strokeWidth={1}
          cornerRadius={3}
          listening={false}
        />
      )}
      <Text
        x={shape.x}
        y={shape.y}
        text={shape.content}
        fontSize={shape.fontSize}
        fontFamily="sans-serif"
        fill={shape.color}
        draggable={draggable}
        onClick={onSelect}
        onDblClick={onEditRequest}
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
    </>
  )
}

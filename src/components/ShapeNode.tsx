import { useRef, useState } from 'react'
import { Line, Rect, Ellipse, Group, Text, Rect as KonvaRect } from 'react-konva'
import type Konva from 'konva'
import type { Shape, ToolType, TextShape, ArrowShape } from '../types'
import { StickyEditor } from './StickyEditor'
import { TextShapeNode } from './TextShapeNode'
import { ArrowShapeNode } from './ArrowShapeNode'

interface Props {
  shape: Shape
  isSelected: boolean
  tool: ToolType
  onSelect: () => void
  onMove: (dx: number, dy: number) => void
  onContentChange: (content: string) => void
}

export function ShapeNode({ shape, isSelected, tool, onSelect, onMove, onContentChange }: Props) {
  const [editing, setEditing] = useState(false)
  const dragStart = useRef<{ x: number; y: number } | null>(null)

  const draggable = tool === 'select'

  const commonProps = {
    draggable,
    onClick: onSelect,
    onDragStart: (e: Konva.KonvaEventObject<DragEvent>) => {
      dragStart.current = { x: e.target.x(), y: e.target.y() }
    },
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
      if (!dragStart.current) return
      const dx = e.target.x() - dragStart.current.x
      const dy = e.target.y() - dragStart.current.y
      onMove(dx, dy)
      // Reset visual position (Yjs drives actual position)
      e.target.x(dragStart.current.x)
      e.target.y(dragStart.current.y)
      dragStart.current = null
    },
  }

  if (shape.type === 'path') {
    return (
      <Line
        points={shape.points}
        stroke={shape.color}
        strokeWidth={shape.strokeWidth}
        lineCap="round"
        lineJoin="round"
        tension={0.4}
        {...commonProps}
      />
    )
  }

  if (shape.type === 'rect') {
    return (
      <Rect
        x={shape.x} y={shape.y}
        width={shape.width} height={shape.height}
        stroke={shape.color}
        strokeWidth={2}
        fill={shape.color + '22'}
        shadowColor={isSelected ? '#6366f1' : undefined}
        shadowBlur={isSelected ? 12 : 0}
        {...commonProps}
      />
    )
  }

  if (shape.type === 'ellipse') {
    return (
      <Ellipse
        x={shape.x} y={shape.y}
        radiusX={shape.radiusX} radiusY={shape.radiusY}
        stroke={shape.color}
        strokeWidth={2}
        fill={shape.color + '22'}
        shadowColor={isSelected ? '#6366f1' : undefined}
        shadowBlur={isSelected ? 12 : 0}
        {...commonProps}
      />
    )
  }

  if (shape.type === 'sticky') {
    return (
      <>
        <Group x={shape.x} y={shape.y} {...commonProps}>
          {/* Card */}
          <KonvaRect
            width={shape.width}
            height={shape.height}
            fill={shape.bgColor}
            cornerRadius={6}
            shadowColor="rgba(0,0,0,0.18)"
            shadowBlur={8}
            shadowOffsetY={3}
            strokeWidth={isSelected ? 2 : 0}
            stroke={isSelected ? '#6366f1' : undefined}
          />
          {/* Top strip */}
          <KonvaRect
            width={shape.width}
            height={10}
            fill={shape.bgColor}
            cornerRadius={[6, 6, 0, 0]}
            opacity={0.6}
          />
          <Text
            text={shape.content}
            fontSize={13}
            fontFamily="sans-serif"
            fill="#1e293b"
            x={10}
            y={18}
            width={shape.width - 20}
            wrap="word"
            onDblClick={() => setEditing(true)}
          />
        </Group>
        {editing && (
          <StickyEditor
            shape={shape}
            stageScale={1}
            stagePos={{ x: 0, y: 0 }}
            onCommit={(content) => {
              onContentChange(content)
              setEditing(false)
            }}
            onClose={() => setEditing(false)}
          />
        )}
      </>
    )
  }

  if (shape.type === 'text') {
    return (
      <TextShapeNode
        shape={shape as TextShape}
        isSelected={isSelected}
        tool={tool}
        onSelect={onSelect}
        onMove={onMove}
        onContentChange={onContentChange}
      />
    )
  }

  if (shape.type === 'arrow') {
    return (
      <ArrowShapeNode
        shape={shape as ArrowShape}
        isSelected={isSelected}
        tool={tool}
        onSelect={onSelect}
        onMove={onMove}
      />
    )
  }

  return null
}

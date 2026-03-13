import { useRef, useState, useEffect } from 'react'
import { Line, Rect, Ellipse, Group, Text, Rect as KonvaRect, Image as KonvaImage } from 'react-konva'
import type Konva from 'konva'
import type { Shape, ToolType, TextShape, ArrowShape, RectShape, EllipseShape, StickyShape, ImageShape } from '../types'
import { TextShapeNode } from './TextShapeNode'
import { ArrowShapeNode } from './ArrowShapeNode'
import { ResizeHandles } from './ResizeHandles'

interface Props {
  shape: Shape
  isSelected: boolean
  tool: ToolType
  onSelect: () => void
  onMove: (dx: number, dy: number) => void
  onContentChange: (content: string) => void
  onUpdate: (updates: Partial<Shape>) => void
  onEditRequest: (shape: Shape) => void
}

export function ShapeNode({ shape, isSelected, tool, onSelect, onMove, onContentChange, onUpdate, onEditRequest }: Props) {
  const dragStart = useRef<{ x: number; y: number } | null>(null)

  const draggable = tool === 'select'

  const commonProps = {
    draggable,
    opacity: shape.opacity ?? 1,
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
      <>
        <Rect
          x={shape.x} y={shape.y}
          width={shape.width} height={shape.height}
          stroke={shape.color}
          strokeWidth={2}
          fill={shape.fillColor && shape.fillColor !== 'transparent' ? shape.fillColor : shape.color + '22'}
          shadowColor={isSelected ? '#6366f1' : undefined}
          shadowBlur={isSelected ? 12 : 0}
          {...commonProps}
        />
        {isSelected && tool === 'select' && (
          <ResizeHandles
            shape={shape as RectShape}
            onUpdate={(u) => onUpdate(u as Partial<Shape>)}
          />
        )}
      </>
    )
  }

  if (shape.type === 'ellipse') {
    return (
      <>
        <Ellipse
          x={shape.x} y={shape.y}
          radiusX={shape.radiusX} radiusY={shape.radiusY}
          stroke={shape.color}
          strokeWidth={2}
          fill={shape.fillColor && shape.fillColor !== 'transparent' ? shape.fillColor : shape.color + '22'}
          shadowColor={isSelected ? '#6366f1' : undefined}
          shadowBlur={isSelected ? 12 : 0}
          {...commonProps}
        />
        {isSelected && tool === 'select' && (
          <ResizeHandles
            shape={shape as EllipseShape}
            onUpdate={(u) => onUpdate(u as Partial<Shape>)}
          />
        )}
      </>
    )
  }

  if (shape.type === 'sticky') {
    return (
      <>
        <Group x={shape.x} y={shape.y} {...commonProps} onDblClick={() => onEditRequest(shape)}>
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
          />
        </Group>
        {isSelected && tool === 'select' && (
          <ResizeHandles
            shape={shape as StickyShape}
            onUpdate={(u) => onUpdate(u as Partial<Shape>)}
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
        onEditRequest={() => onEditRequest(shape)}
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
        onUpdate={(u) => onUpdate(u as Partial<Shape>)}
      />
    )
  }

  if (shape.type === 'image') {
    return <ImageShapeNode shape={shape as ImageShape} isSelected={isSelected} {...commonProps} />
  }

  return null
}

function ImageShapeNode({ shape, isSelected, ...commonProps }: {
  shape: ImageShape
  isSelected: boolean
  draggable: boolean
  onClick: () => void
  onDragStart: (e: Konva.KonvaEventObject<DragEvent>) => void
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void
}) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  useEffect(() => {
    const img = new window.Image()
    img.src = shape.src
    img.onload = () => setImage(img)
  }, [shape.src])

  return (
    <KonvaImage
      image={image ?? undefined}
      x={shape.x} y={shape.y}
      width={shape.width} height={shape.height}
      shadowColor={isSelected ? '#6366f1' : undefined}
      shadowBlur={isSelected ? 12 : 0}
      {...commonProps}
    />
  )
}

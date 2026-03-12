import { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
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
}

function TextEditor({
  shape,
  onCommit,
  onClose,
}: {
  shape: TextShape
  onCommit: (content: string) => void
  onClose: () => void
}) {
  const [value, setValue] = useState(shape.content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.focus()
    el.select()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onCommit(value)
    }
  }

  const handleBlur = () => {
    onCommit(value)
  }

  return ReactDOM.createPortal(
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      style={{
        position: 'fixed',
        left: shape.x,
        top: shape.y,
        minWidth: 120,
        minHeight: shape.fontSize + 8,
        background: 'rgba(255,255,255,0.85)',
        border: '1px solid #6366f1',
        borderRadius: 4,
        outline: 'none',
        resize: 'both',
        font: `${shape.fontSize}px sans-serif`,
        color: shape.color,
        padding: '2px 4px',
        boxSizing: 'border-box',
        zIndex: 1000,
      }}
    />,
    document.body
  )
}

export function TextShapeNode({ shape, isSelected, tool, onSelect, onMove, onContentChange }: Props) {
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
      e.target.x(dragStart.current.x)
      e.target.y(dragStart.current.y)
      dragStart.current = null
    },
  }

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
        onDblClick={() => setEditing(true)}
        {...commonProps}
      />
      {editing && (
        <TextEditor
          shape={shape}
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

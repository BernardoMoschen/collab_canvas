import { useEffect, useRef, useState } from 'react'
import type { TextShape } from '../types'

interface Props {
  shape: TextShape
  stageScale: number
  stagePos: { x: number; y: number }
  onCommit: (content: string) => void
  onClose: () => void
}

export function TextEditor({ shape, stageScale, stagePos, onCommit, onClose }: Props) {
  const [value, setValue] = useState(shape.content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.focus()
    el.select()
  }, [])

  const left = shape.x * stageScale + stagePos.x
  const top = shape.y * stageScale + stagePos.y

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

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => { onCommit(value); onClose() }}
      onKeyDown={handleKeyDown}
      style={{
        position: 'fixed',
        left,
        top,
        minWidth: 120,
        minHeight: (shape.fontSize + 8) * stageScale,
        background: 'rgba(255,255,255,0.85)',
        border: '1px solid #6366f1',
        borderRadius: 4,
        outline: 'none',
        resize: 'both',
        font: `${shape.fontSize * stageScale}px sans-serif`,
        color: shape.color,
        padding: '2px 4px',
        boxSizing: 'border-box',
        zIndex: 1000,
      }}
    />
  )
}

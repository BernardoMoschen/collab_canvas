import { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import type { StickyShape } from '../types'

interface Props {
  shape: StickyShape
  stageScale: number
  stagePos: { x: number; y: number }
  onCommit: (content: string) => void
  onClose: () => void
}

export function StickyEditor({ shape, stageScale, stagePos, onCommit, onClose }: Props) {
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
  const width = shape.width * stageScale
  const height = shape.height * stageScale

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (e.key === 'Enter' && e.ctrlKey) {
      onCommit(value)
      onClose()
    }
  }

  return ReactDOM.createPortal(
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={onClose}
      onKeyDown={handleKeyDown}
      style={{
        position: 'fixed',
        left,
        top,
        width,
        height,
        background: 'transparent',
        border: 'none',
        outline: 'none',
        resize: 'none',
        font: `13px sans-serif`,
        color: '#1e293b',
        paddingLeft: 10,
        paddingTop: 18,
        paddingRight: 10,
        paddingBottom: 0,
        boxSizing: 'border-box',
        zIndex: 1000,
        overflow: 'hidden',
      }}
    />,
    document.body
  )
}

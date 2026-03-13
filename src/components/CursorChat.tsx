import { useEffect, useRef, useState } from 'react'

interface Props {
  x: number
  y: number
  onSend: (message: string) => void
  onClose: () => void
}

const MAX_LENGTH = 80
const INPUT_WIDTH = 220
const INPUT_HEIGHT = 36
const PADDING_H = 8

export function CursorChat({ x, y, onSend, onClose }: Props) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Adjust position to stay within viewport
  const adjustedX = Math.min(x, window.innerWidth - INPUT_WIDTH - 16)
  const adjustedY = Math.min(
    y,
    window.innerHeight - INPUT_HEIGHT - 28 /* hint label */ - 8,
  )

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const trimmed = value.trim()
      if (trimmed) {
        onSend(trimmed)
      }
      onClose()
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: adjustedX,
        top: adjustedY,
        zIndex: 9050,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        pointerEvents: 'auto',
      }}
    >
      {/* Pill input */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          width: INPUT_WIDTH,
          height: INPUT_HEIGHT,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '2px solid #6366f1',
          borderRadius: INPUT_HEIGHT / 2,
          boxShadow: '0 4px 20px rgba(99,102,241,0.25), 0 2px 8px rgba(0,0,0,0.08)',
          paddingLeft: PADDING_H + 4,
          paddingRight: PADDING_H,
          gap: 6,
          boxSizing: 'border-box',
        }}
      >
        {/* Cursor chat icon */}
        <span
          style={{
            fontSize: 14,
            flexShrink: 0,
            lineHeight: 1,
            userSelect: 'none',
          }}
          aria-hidden
        >
          💬
        </span>

        <input
          ref={inputRef}
          type="text"
          value={value}
          maxLength={MAX_LENGTH}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Say something…"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 13,
            color: '#1e293b',
            minWidth: 0,
            fontFamily: 'inherit',
          }}
        />

        {/* Character counter when nearing limit */}
        {value.length > MAX_LENGTH * 0.75 && (
          <span
            style={{
              fontSize: 10,
              color: value.length >= MAX_LENGTH ? '#ef4444' : '#94a3b8',
              flexShrink: 0,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {MAX_LENGTH - value.length}
          </span>
        )}
      </div>

      {/* Hint label */}
      <div
        style={{
          fontSize: 10,
          color: 'rgba(71,85,105,0.7)',
          paddingLeft: PADDING_H + 4,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        Press{' '}
        <kbd
          style={{
            fontSize: 9,
            fontFamily: 'ui-monospace, monospace',
            fontWeight: 600,
            color: '#6366f1',
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 3,
            padding: '0 3px',
          }}
        >
          Enter
        </kbd>{' '}
        to send &nbsp;·&nbsp;{' '}
        <kbd
          style={{
            fontSize: 9,
            fontFamily: 'ui-monospace, monospace',
            fontWeight: 600,
            color: '#64748b',
            background: 'rgba(0,0,0,0.05)',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: 3,
            padding: '0 3px',
          }}
        >
          Esc
        </kbd>{' '}
        to cancel
      </div>
    </div>
  )
}

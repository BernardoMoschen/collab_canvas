import { useEffect, useRef } from 'react'

interface MenuItem {
  label: string
  icon?: string
  action: () => void
  disabled?: boolean
  divider?: boolean
}

interface Props {
  x: number
  y: number
  items: MenuItem[]
  onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Adjust position to stay within viewport
  const MENU_WIDTH = 192
  const ITEM_HEIGHT = 36
  const DIVIDER_HEIGHT = 9
  const PADDING = 8

  const itemCount = items.filter((i) => !i.divider).length
  const dividerCount = items.filter((i) => i.divider).length
  const estimatedHeight = itemCount * ITEM_HEIGHT + dividerCount * DIVIDER_HEIGHT + PADDING * 2

  const adjustedX = Math.min(x, window.innerWidth - MENU_WIDTH - 8)
  const adjustedY = Math.min(y, window.innerHeight - estimatedHeight - 8)

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: adjustedX,
        top: adjustedY,
        width: MENU_WIDTH,
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 12,
        padding: `${PADDING}px 0`,
        zIndex: 9000,
        userSelect: 'none',
      }}
    >
      {items.map((item, index) => {
        if (item.divider) {
          return (
            <div
              key={index}
              style={{
                height: 1,
                margin: '4px 8px',
                background: 'rgba(0,0,0,0.08)',
              }}
            />
          )
        }

        return (
          <button
            key={index}
            disabled={item.disabled}
            onClick={() => {
              if (!item.disabled) {
                item.action()
                onClose()
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '0 12px',
              height: ITEM_HEIGHT,
              background: 'transparent',
              border: 'none',
              borderRadius: 0,
              textAlign: 'left',
              cursor: item.disabled ? 'default' : 'pointer',
              color: item.disabled ? '#cbd5e1' : '#334155',
              fontSize: 13,
              fontWeight: 400,
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99,102,241,0.08)'
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            }}
          >
            {item.icon && (
              <span
                style={{
                  fontSize: 15,
                  width: 20,
                  textAlign: 'center',
                  flexShrink: 0,
                  opacity: item.disabled ? 0.4 : 1,
                }}
              >
                {item.icon}
              </span>
            )}
            <span style={{ opacity: item.disabled ? 0.5 : 1 }}>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

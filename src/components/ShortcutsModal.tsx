import { useEffect } from 'react'

interface Props {
  onClose: () => void
}

interface ShortcutEntry {
  keys: string[]
  description: string
}

interface ShortcutGroup {
  label: string
  shortcuts: ShortcutEntry[]
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    label: 'Tools',
    shortcuts: [
      { keys: ['S'], description: 'Select' },
      { keys: ['P'], description: 'Pen' },
      { keys: ['R'], description: 'Rectangle' },
      { keys: ['E'], description: 'Ellipse' },
      { keys: ['N'], description: 'Sticky note' },
      { keys: ['T'], description: 'Text' },
      { keys: ['A'], description: 'Arrow' },
    ],
  },
  {
    label: 'Edit',
    shortcuts: [
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
      { keys: ['Ctrl', 'C'], description: 'Copy' },
      { keys: ['Ctrl', 'V'], description: 'Paste' },
      { keys: ['Del'], description: 'Delete selected' },
      { keys: ['↑', '↓', '←', '→'], description: 'Nudge 1px' },
      { keys: ['Shift', '↑↓←→'], description: 'Nudge 10px' },
    ],
  },
  {
    label: 'Canvas',
    shortcuts: [
      { keys: ['Scroll'], description: 'Zoom in / out' },
      { keys: ['Space', 'drag'], description: 'Pan canvas' },
      { keys: ['G'], description: 'Toggle grid' },
      { keys: ['/'], description: 'Cursor chat' },
      { keys: ['?'], description: 'Show shortcuts' },
    ],
  },
]

function KeyBadge({ label }: { label: string }) {
  return (
    <kbd
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: label.length > 1 ? 'auto' : 24,
        height: 22,
        padding: label.length > 1 ? '0 6px' : '0 4px',
        background: 'rgba(99,102,241,0.08)',
        border: '1px solid rgba(99,102,241,0.22)',
        borderRadius: 5,
        fontSize: 11,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontWeight: 600,
        color: '#6366f1',
        letterSpacing: 0,
        boxShadow: '0 1px 0 rgba(99,102,241,0.18)',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </kbd>
  )
}

export function ShortcutsModal({ onClose }: Props) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' || e.key === '?') {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(15,23,42,0.35)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal card */}
      <div
        style={{
          position: 'relative',
          width: 480,
          maxHeight: 'calc(100vh - 64px)',
          overflowY: 'auto',
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 20,
          padding: '28px 32px 32px',
          scrollbarWidth: 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: '#0f172a',
              letterSpacing: -0.3,
            }}
          >
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 8,
              border: '1px solid rgba(0,0,0,0.1)',
              background: 'rgba(0,0,0,0.04)',
              cursor: 'pointer',
              fontSize: 16,
              color: '#64748b',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.09)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.04)'
            }}
            aria-label="Close shortcuts"
          >
            ×
          </button>
        </div>

        {/* Groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.label}>
              {/* Group label */}
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  color: '#6366f1',
                  marginBottom: 10,
                }}
              >
                {group.label}
              </div>

              {/* Shortcut rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '5px 10px',
                      borderRadius: 8,
                      background: 'transparent',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = 'rgba(99,102,241,0.05)'
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = 'transparent'
                    }}
                  >
                    <span style={{ fontSize: 13, color: '#475569' }}>{shortcut.description}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      {shortcut.keys.map((key, i) => (
                        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {i > 0 && (
                            <span style={{ fontSize: 10, color: '#94a3b8', margin: '0 1px' }}>+</span>
                          )}
                          <KeyBadge label={key} />
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div
          style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: '1px solid rgba(0,0,0,0.07)',
            fontSize: 11,
            color: '#94a3b8',
            textAlign: 'center',
          }}
        >
          Press <KeyBadge label="Esc" /> or <KeyBadge label="?" /> to close
        </div>
      </div>
    </div>
  )
}

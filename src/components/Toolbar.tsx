import { useStore } from '../store'
import { useUndoRedo } from '../hooks/useUndoRedo'
import { useShapes } from '../hooks/useShapes'
import { updateShapeField } from '../lib/room'
import { STICKY_COLORS } from '../lib/colors'
import type { ToolType } from '../types'

const STROKE_COLORS = [
  '#1e293b', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
]

const FILL_COLORS = [
  'transparent', '#fef9c3', '#fce7f3', '#ede9fe',
  '#dbeafe', '#dcfce7', '#ffedd5', '#f1f5f9',
]

const TOOLS: { id: ToolType; label: string; icon: string; hint: string }[] = [
  { id: 'select', label: 'Select', icon: '↖', hint: 'S' },
  { id: 'pen', label: 'Pen', icon: '✏️', hint: 'P' },
  { id: 'rect', label: 'Rect', icon: '▭', hint: 'R' },
  { id: 'ellipse', label: 'Circle', icon: '○', hint: 'E' },
  { id: 'sticky', label: 'Sticky', icon: '📝', hint: 'N' },
  { id: 'text', label: 'Text', icon: 'T', hint: 'T' },
  { id: 'arrow', label: 'Arrow', icon: '→', hint: 'A' },
]

export function Toolbar() {
  const {
    tool, strokeColor, strokeWidth, stickyColor, fillColor,
    setTool, setStrokeColor, setStrokeWidth, setStickyColor, setFillColor,
    selectedIds,
    darkMode, gridEnabled, snapToGrid,
    toggleDarkMode, toggleGrid, toggleSnapToGrid,
  } = useStore()
  const { undo, redo, canUndo, canRedo } = useUndoRedo()
  const shapes = useShapes()

  const firstSelected = selectedIds.length > 0 ? shapes.find((s) => s.id === selectedIds[0]) : null
  const currentOpacity = firstSelected?.opacity ?? 1

  const divider = <div className="my-1 h-px" style={{ background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />

  const textColor = darkMode ? '#e2e8f0' : '#334155'

  return (
    <div
      className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1 p-2 rounded-2xl"
      style={{
        background: darkMode ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.07)',
        maxHeight: 'calc(100vh - 2rem)',
        overflowY: 'auto',
        scrollbarWidth: 'none',
      }}
    >
      {/* Tools */}
      {TOOLS.map((t) => (
        <button
          key={t.id}
          title={`${t.label} (${t.hint})`}
          onClick={() => setTool(t.id)}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all"
          style={{
            background: tool === t.id ? '#6366f1' : 'transparent',
            color: tool === t.id ? '#fff' : textColor,
            boxShadow: tool === t.id ? '0 2px 8px rgba(99,102,241,0.4)' : 'none',
          }}
        >
          {t.icon}
        </button>
      ))}

      {divider}

      {/* Stroke color swatches */}
      {(tool === 'pen' || tool === 'rect' || tool === 'ellipse' || tool === 'text' || tool === 'arrow') && (
        <>
          {STROKE_COLORS.map((c) => (
            <button
              key={c}
              title={c}
              onClick={() => setStrokeColor(c)}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
              style={{ background: strokeColor === c ? c + '1a' : 'transparent' }}
            >
              <div
                className="w-5 h-5 rounded-full"
                style={{
                  background: c,
                  outline: strokeColor === c ? `2px solid ${c}` : 'none',
                  outlineOffset: '2px',
                  transform: strokeColor === c ? 'scale(1.15)' : 'scale(1)',
                  transition: 'transform 0.15s',
                }}
              />
            </button>
          ))}
          {divider}
        </>
      )}

      {/* Stroke width (for pen/rect/ellipse/arrow) */}
      {(tool === 'pen' || tool === 'rect' || tool === 'ellipse' || tool === 'arrow') && (
        <>
          <div style={{ padding: '2px 4px' }}>
            <div style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>
              Width
            </div>
            <input
              type="range"
              min={1}
              max={16}
              step={1}
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              style={{ width: 32, accentColor: '#6366f1', cursor: 'pointer' }}
            />
          </div>
          {divider}
        </>
      )}

      {/* Fill color swatches (for rect/ellipse) */}
      {(tool === 'rect' || tool === 'ellipse') && (
        <>
          <div style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', letterSpacing: 0.5, textTransform: 'uppercase' }}>Fill</div>
          {FILL_COLORS.map((c) => (
            <button
              key={c}
              title={c === 'transparent' ? 'No fill' : c}
              onClick={() => setFillColor(c)}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
              style={{ background: fillColor === c ? 'rgba(99,102,241,0.1)' : 'transparent' }}
            >
              <div
                className="w-5 h-5 rounded"
                style={{
                  background: c === 'transparent'
                    ? 'linear-gradient(to bottom right, #fff 45%, #f87171 45%, #f87171 55%, #fff 55%)'
                    : c,
                  border: '1.5px solid rgba(0,0,0,0.15)',
                  outline: fillColor === c ? '2px solid #6366f1' : 'none',
                  outlineOffset: '2px',
                }}
              />
            </button>
          ))}
          {divider}
        </>
      )}

      {/* Undo / Redo */}
      {[
        { fn: undo, enabled: canUndo, icon: '↩', label: 'Undo (Ctrl+Z)' },
        { fn: redo, enabled: canRedo, icon: '↪', label: 'Redo (Ctrl+Shift+Z)' },
      ].map(({ fn, enabled, icon, label }) => (
        <button
          key={label}
          onClick={fn}
          disabled={!enabled}
          title={label}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-base transition-all"
          style={{
            background: 'transparent',
            color: enabled ? textColor : '#cbd5e1',
            cursor: enabled ? 'pointer' : 'default',
          }}
        >
          {icon}
        </button>
      ))}

      {/* Sticky color swatches */}
      {tool === 'sticky' && (
        <>
          {STICKY_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setStickyColor(c)}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
              style={{ background: stickyColor === c ? c + '44' : 'transparent' }}
            >
              <div
                className="w-5 h-5 rounded"
                style={{
                  background: c,
                  outline: stickyColor === c ? `2px solid #6366f1` : 'none',
                  outlineOffset: '2px',
                  transform: stickyColor === c ? 'scale(1.15)' : 'scale(1)',
                  transition: 'transform 0.15s',
                }}
              />
            </button>
          ))}
          {divider}
        </>
      )}

      {/* Opacity slider (when shapes are selected in select mode) */}
      {tool === 'select' && selectedIds.length > 0 && (
        <>
          {divider}
          <div style={{ padding: '2px 4px' }}>
            <div style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>
              Opacity
            </div>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={currentOpacity}
              onChange={(e) => {
                const opacity = parseFloat(e.target.value)
                for (const id of selectedIds) updateShapeField(id, 'opacity', opacity)
              }}
              style={{ width: 32, accentColor: '#6366f1', cursor: 'pointer' }}
            />
          </div>
        </>
      )}

      {divider}

      {/* Canvas toggles */}
      <button
        title={`Grid (G) — ${gridEnabled ? 'on' : 'off'}`}
        onClick={toggleGrid}
        className="w-10 h-10 rounded-xl flex items-center justify-center text-base transition-all"
        style={{
          background: gridEnabled ? '#6366f1' : 'transparent',
          color: gridEnabled ? '#fff' : textColor,
          fontSize: 14,
        }}
      >
        #
      </button>
      <button
        title={`Snap to grid — ${snapToGrid ? 'on' : 'off'}`}
        onClick={toggleSnapToGrid}
        className="w-10 h-10 rounded-xl flex items-center justify-center text-base transition-all"
        style={{
          background: snapToGrid ? '#6366f1' : 'transparent',
          color: snapToGrid ? '#fff' : textColor,
          fontSize: 16,
        }}
      >
        ⊞
      </button>
      <button
        title={`Dark mode — ${darkMode ? 'on' : 'off'}`}
        onClick={toggleDarkMode}
        className="w-10 h-10 rounded-xl flex items-center justify-center text-base transition-all"
        style={{
          background: darkMode ? '#6366f1' : 'transparent',
          color: darkMode ? '#fff' : textColor,
          fontSize: 15,
        }}
      >
        {darkMode ? '☀' : '🌙'}
      </button>
    </div>
  )
}

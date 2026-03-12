import { useStore } from '../store'
import { STICKY_COLORS } from '../lib/colors'
import type { ToolType } from '../types'

const STROKE_COLORS = [
  '#1e293b', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
]

const TOOLS: { id: ToolType; label: string; icon: string; hint: string }[] = [
  { id: 'select', label: 'Select', icon: '↖', hint: 'S' },
  { id: 'pen', label: 'Pen', icon: '✏️', hint: 'P' },
  { id: 'rect', label: 'Rect', icon: '▭', hint: 'R' },
  { id: 'ellipse', label: 'Circle', icon: '○', hint: 'E' },
  { id: 'sticky', label: 'Sticky', icon: '📝', hint: 'N' },
]

export function Toolbar() {
  const { tool, strokeColor, stickyColor, setTool, setStrokeColor, setStickyColor } = useStore()

  return (
    <div
      className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1 p-2 rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        border: '1px solid rgba(0,0,0,0.07)',
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
            color: tool === t.id ? '#fff' : '#334155',
            boxShadow: tool === t.id ? '0 2px 8px rgba(99,102,241,0.4)' : 'none',
          }}
        >
          {t.icon}
        </button>
      ))}

      {/* Divider */}
      <div className="my-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />

      {/* Stroke color swatches (for pen / shapes) */}
      {(tool === 'pen' || tool === 'rect' || tool === 'ellipse') && (
        <>
          {STROKE_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setStrokeColor(c)}
              className="w-6 h-6 rounded-full mx-auto transition-transform hover:scale-110"
              style={{
                background: c,
                outline: strokeColor === c ? `2px solid ${c}` : 'none',
                outlineOffset: '2px',
              }}
            />
          ))}
          <div className="my-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
        </>
      )}

      {/* Sticky color swatches */}
      {tool === 'sticky' && (
        <>
          {STICKY_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setStickyColor(c)}
              className="w-6 h-6 rounded mx-auto transition-transform hover:scale-110"
              style={{
                background: c,
                outline: stickyColor === c ? `2px solid #6366f1` : 'none',
                outlineOffset: '2px',
              }}
            />
          ))}
          <div className="my-1 h-px" style={{ background: 'rgba(0,0,0,0.08)' }} />
        </>
      )}
    </div>
  )
}

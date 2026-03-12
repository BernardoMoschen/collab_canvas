import { getRoom } from '../lib/room'

export function ClearCanvas() {
  function handleClear() {
    if (!window.confirm('Clear the entire canvas? This cannot be undone.')) return
    const { shapes } = getRoom()
    shapes.delete(0, shapes.length)
  }

  return (
    <button
      onClick={handleClear}
      title="Clear canvas"
      className="absolute top-4 right-4 z-20 flex items-center justify-center rounded-xl transition-all select-none group"
      style={{
        width: 40,
        height: 40,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        border: '1px solid rgba(0,0,0,0.07)',
        fontSize: 18,
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.background = 'rgba(254,226,226,0.96)'
        el.style.border = '1px solid rgba(239,68,68,0.25)'
        el.style.boxShadow = '0 4px 24px rgba(239,68,68,0.15)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.background = 'rgba(255,255,255,0.92)'
        el.style.border = '1px solid rgba(0,0,0,0.07)'
        el.style.boxShadow = '0 4px 24px rgba(0,0,0,0.10)'
      }}
    >
      <span role="img" aria-label="Clear canvas">🗑️</span>
    </button>
  )
}

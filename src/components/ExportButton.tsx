import { useState } from 'react'
import type Konva from 'konva'

interface ExportButtonProps {
  stageRef: React.RefObject<Konva.Stage | null>
}

export function ExportButton({ stageRef }: ExportButtonProps) {
  const [exported, setExported] = useState(false)

  function handleExport() {
    const dataUrl = stageRef.current?.toDataURL({ pixelRatio: 2 })
    if (!dataUrl) return

    const a = document.createElement('a')
    a.href = dataUrl
    a.download = 'collab-canvas.png'
    a.click()

    setExported(true)
    setTimeout(() => setExported(false), 1500)
  }

  return (
    <button
      onClick={handleExport}
      title="Export as PNG"
      className="absolute bottom-4 right-20 z-20 flex items-center justify-center rounded-xl transition-all select-none"
      style={{
        width: 40,
        height: 40,
        background: exported ? 'rgba(34,197,94,0.92)' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        border: '1px solid rgba(0,0,0,0.07)',
        fontSize: 18,
        cursor: 'pointer',
      }}
    >
      {exported ? (
        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>✓</span>
      ) : (
        <span role="img" aria-label="Export">📷</span>
      )}

      {/* "Exported!" tooltip flash */}
      {exported && (
        <span
          className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap px-2 py-0.5 rounded-lg pointer-events-none"
          style={{
            background: 'rgba(34,197,94,0.92)',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}
        >
          Exported!
        </span>
      )}
    </button>
  )
}

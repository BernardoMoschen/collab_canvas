import { useState, useEffect } from 'react'
import { globalStageRef } from './Canvas'

export function ZoomControls() {
  const [scale, setScale] = useState(100)

  // Sync display with actual stage scale
  useEffect(() => {
    const interval = setInterval(() => {
      const s = globalStageRef.current?.scaleX() ?? 1
      setScale(Math.round(s * 100))
    }, 100)
    return () => clearInterval(interval)
  }, [])

  function zoom(factor: number) {
    const stage = globalStageRef.current
    if (!stage) return
    const oldScale = stage.scaleX()
    const newScale = Math.min(5, Math.max(0.1, oldScale * factor))
    stage.scale({ x: newScale, y: newScale })
    setScale(Math.round(newScale * 100))
  }

  function resetZoom() {
    const stage = globalStageRef.current
    if (!stage) return
    stage.scale({ x: 1, y: 1 })
    stage.position({ x: 0, y: 0 })
    setScale(100)
  }

  return (
    <div
      className="absolute bottom-4 right-48 z-20 flex items-center gap-1 px-2 py-1 rounded-xl"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
        border: '1px solid rgba(0,0,0,0.07)',
      }}
    >
      <button
        onClick={() => zoom(0.8)}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100"
      >
        −
      </button>
      <button
        onClick={resetZoom}
        className="text-xs font-mono w-12 text-center text-slate-500 hover:text-slate-800"
      >
        {scale}%
      </button>
      <button
        onClick={() => zoom(1.25)}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100"
      >
        +
      </button>
    </div>
  )
}

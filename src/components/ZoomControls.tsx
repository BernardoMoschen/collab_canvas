import { useState, useEffect } from 'react'
import { globalStageRef } from './Canvas'
import { getRoom } from '../lib/room'

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

  function fitToContent() {
    const stage = globalStageRef.current
    if (!stage) return

    const { shapes } = getRoom()
    const arr = shapes.toArray()
    if (arr.length === 0) { resetZoom(); return }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

    for (const yMap of arr) {
      const type = yMap.get('type') as string
      if (type === 'path') {
        const points = yMap.get('points') as number[]
        for (let i = 0; i < points.length - 1; i += 2) {
          minX = Math.min(minX, points[i]); maxX = Math.max(maxX, points[i])
          minY = Math.min(minY, points[i + 1]); maxY = Math.max(maxY, points[i + 1])
        }
      } else if (type === 'arrow') {
        const x1 = yMap.get('x1') as number, y1 = yMap.get('y1') as number
        const x2 = yMap.get('x2') as number, y2 = yMap.get('y2') as number
        minX = Math.min(minX, x1, x2); maxX = Math.max(maxX, x1, x2)
        minY = Math.min(minY, y1, y2); maxY = Math.max(maxY, y1, y2)
      } else if (type === 'ellipse') {
        const x = yMap.get('x') as number, y = yMap.get('y') as number
        const rx = yMap.get('radiusX') as number, ry = yMap.get('radiusY') as number
        minX = Math.min(minX, x - rx); maxX = Math.max(maxX, x + rx)
        minY = Math.min(minY, y - ry); maxY = Math.max(maxY, y + ry)
      } else {
        const x = yMap.get('x') as number, y = yMap.get('y') as number
        const w = (yMap.get('width') as number) || 0
        const h = (yMap.get('height') as number) || 0
        minX = Math.min(minX, x); maxX = Math.max(maxX, x + w)
        minY = Math.min(minY, y); maxY = Math.max(maxY, y + h)
      }
    }

    if (!isFinite(minX)) return

    const PAD = 60
    const contentW = maxX - minX + PAD * 2
    const contentH = maxY - minY + PAD * 2
    const newScale = Math.min(5, Math.max(0.1, Math.min(
      window.innerWidth / contentW,
      window.innerHeight / contentH,
    )))
    stage.scale({ x: newScale, y: newScale })
    stage.position({
      x: (window.innerWidth - contentW * newScale) / 2 - (minX - PAD) * newScale,
      y: (window.innerHeight - contentH * newScale) / 2 - (minY - PAD) * newScale,
    })
    setScale(Math.round(newScale * 100))
  }

  return (
    <div
      className="absolute bottom-4 right-16 z-20 flex items-center gap-1 px-2 py-1 rounded-xl"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
        border: '1px solid rgba(0,0,0,0.07)',
      }}
    >
      <button
        onClick={() => zoom(0.8)}
        title="Zoom out"
        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100"
      >
        −
      </button>
      <button
        onClick={resetZoom}
        title="Reset zoom (100%)"
        className="text-xs font-mono w-12 text-center text-slate-500 hover:text-slate-800"
      >
        {scale}%
      </button>
      <button
        onClick={() => zoom(1.25)}
        title="Zoom in"
        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100"
      >
        +
      </button>
      <button
        onClick={fitToContent}
        title="Fit all shapes in view"
        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 text-xs"
        style={{ fontSize: 13 }}
      >
        ⊡
      </button>
    </div>
  )
}

import { useEffect, useRef, useCallback } from 'react'
import type Konva from 'konva'
import type { Shape } from '../types'

interface Props {
  shapes: Shape[]
  stageRef: { current: Konva.Stage | null }
}

const MAP_W = 160
const MAP_H = 100
const PAD = 50

/** Returns the bounding box covering all shapes, in canvas coordinates. */
function getShapesBounds(shapes: Shape[]): { minX: number; minY: number; maxX: number; maxY: number } | null {
  if (shapes.length === 0) return null

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const shape of shapes) {
    if (shape.type === 'path') {
      for (let i = 0; i < shape.points.length - 1; i += 2) {
        minX = Math.min(minX, shape.points[i])
        minY = Math.min(minY, shape.points[i + 1])
        maxX = Math.max(maxX, shape.points[i])
        maxY = Math.max(maxY, shape.points[i + 1])
      }
    } else if (shape.type === 'rect' || shape.type === 'sticky') {
      minX = Math.min(minX, shape.x)
      minY = Math.min(minY, shape.y)
      maxX = Math.max(maxX, shape.x + shape.width)
      maxY = Math.max(maxY, shape.y + shape.height)
    } else if (shape.type === 'ellipse') {
      minX = Math.min(minX, shape.x - shape.radiusX)
      minY = Math.min(minY, shape.y - shape.radiusY)
      maxX = Math.max(maxX, shape.x + shape.radiusX)
      maxY = Math.max(maxY, shape.y + shape.radiusY)
    } else if (shape.type === 'text') {
      const approxW = shape.content.length * shape.fontSize * 0.6
      const approxH = shape.fontSize * 1.3
      minX = Math.min(minX, shape.x)
      minY = Math.min(minY, shape.y)
      maxX = Math.max(maxX, shape.x + approxW)
      maxY = Math.max(maxY, shape.y + approxH)
    } else if (shape.type === 'arrow') {
      minX = Math.min(minX, shape.x1, shape.x2)
      minY = Math.min(minY, shape.y1, shape.y2)
      maxX = Math.max(maxX, shape.x1, shape.x2)
      maxY = Math.max(maxY, shape.y1, shape.y2)
    }
  }

  if (!isFinite(minX)) return null
  return { minX, minY, maxX, maxY }
}

/** Parse a CSS hex or rgb color string to an rgba string with given alpha. */
function colorWithAlpha(color: string, alpha: number): string {
  // For hex colors like #rrggbb or #rgb
  if (color.startsWith('#')) {
    let hex = color.slice(1)
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('')
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return `rgba(${r},${g},${b},${alpha})`
  }
  return color
}

export function Minimap({ shapes, stageRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, MAP_W, MAP_H)

    const stage = stageRef.current

    // Compute bounds of all content
    const rawBounds = getShapesBounds(shapes)

    // If there are no shapes, use a default canvas area based on viewport
    const bounds = rawBounds ?? {
      minX: stage ? (-stage.x()) / (stage.scaleX() || 1) : 0,
      minY: stage ? (-stage.y()) / (stage.scaleY() || 1) : 0,
      maxX: stage ? (window.innerWidth - stage.x()) / (stage.scaleX() || 1) : window.innerWidth,
      maxY: stage ? (window.innerHeight - stage.y()) / (stage.scaleY() || 1) : window.innerHeight,
    }

    const padded = {
      minX: bounds.minX - PAD,
      minY: bounds.minY - PAD,
      maxX: bounds.maxX + PAD,
      maxY: bounds.maxY + PAD,
    }

    const contentW = padded.maxX - padded.minX
    const contentH = padded.maxY - padded.minY

    // Compute scale to fit content in MAP_W x MAP_H (letterbox / maintain aspect ratio)
    const scaleX = MAP_W / contentW
    const scaleY = MAP_H / contentH
    const mapScale = Math.min(scaleX, scaleY)

    const scaledW = contentW * mapScale
    const scaledH = contentH * mapScale
    const offsetX = (MAP_W - scaledW) / 2
    const offsetY = (MAP_H - scaledH) / 2

    /** Converts canvas coords to minimap pixel coords */
    function toMap(cx: number, cy: number): [number, number] {
      return [
        (cx - padded.minX) * mapScale + offsetX,
        (cy - padded.minY) * mapScale + offsetY,
      ]
    }

    function toMapSize(cw: number, ch: number): [number, number] {
      return [cw * mapScale, ch * mapScale]
    }

    // Draw shapes as simplified colored blobs
    for (const shape of shapes) {
      ctx.fillStyle = colorWithAlpha(shape.color, 0.75)
      ctx.strokeStyle = colorWithAlpha(shape.color, 0.9)

      if (shape.type === 'path') {
        if (shape.points.length < 4) continue
        ctx.beginPath()
        const [sx, sy] = toMap(shape.points[0], shape.points[1])
        ctx.moveTo(sx, sy)
        for (let i = 2; i < shape.points.length - 1; i += 2) {
          const [px, py] = toMap(shape.points[i], shape.points[i + 1])
          ctx.lineTo(px, py)
        }
        ctx.lineWidth = Math.max(1, shape.strokeWidth * mapScale)
        ctx.strokeStyle = colorWithAlpha(shape.color, 0.8)
        ctx.stroke()
      } else if (shape.type === 'rect') {
        const [mx, my] = toMap(shape.x, shape.y)
        const [mw, mh] = toMapSize(shape.width, shape.height)
        const r = Math.min(2, mw / 4, mh / 4)
        ctx.beginPath()
        ctx.roundRect(mx, my, Math.max(2, mw), Math.max(2, mh), r)
        ctx.fill()
      } else if (shape.type === 'ellipse') {
        const [mx, my] = toMap(shape.x, shape.y)
        const rX = Math.max(1, shape.radiusX * mapScale)
        const rY = Math.max(1, shape.radiusY * mapScale)
        ctx.beginPath()
        ctx.ellipse(mx, my, rX, rY, 0, 0, Math.PI * 2)
        ctx.fill()
      } else if (shape.type === 'sticky') {
        ctx.fillStyle = colorWithAlpha(shape.bgColor, 0.85)
        const [mx, my] = toMap(shape.x, shape.y)
        const [mw, mh] = toMapSize(shape.width, shape.height)
        const r = Math.min(2, mw / 4, mh / 4)
        ctx.beginPath()
        ctx.roundRect(mx, my, Math.max(2, mw), Math.max(2, mh), r)
        ctx.fill()
      } else if (shape.type === 'text') {
        const approxW = shape.content.length * shape.fontSize * 0.6
        const approxH = shape.fontSize * 1.3
        const [mx, my] = toMap(shape.x, shape.y)
        const [mw, mh] = toMapSize(approxW, approxH)
        ctx.beginPath()
        ctx.roundRect(mx, my, Math.max(2, mw), Math.max(2, mh), 1)
        ctx.fill()
      } else if (shape.type === 'arrow') {
        const [sx, sy] = toMap(shape.x1, shape.y1)
        const [ex, ey] = toMap(shape.x2, shape.y2)
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.lineTo(ex, ey)
        ctx.lineWidth = Math.max(1, shape.strokeWidth * mapScale)
        ctx.strokeStyle = colorWithAlpha(shape.color, 0.8)
        ctx.stroke()
      }
    }

    // Draw viewport indicator
    if (stage) {
      const stageScale = stage.scaleX()
      const stageX = stage.x()
      const stageY = stage.y()

      // Viewport corners in canvas coords
      const vx = -stageX / stageScale
      const vy = -stageY / stageScale
      const vw = window.innerWidth / stageScale
      const vh = window.innerHeight / stageScale

      const [vpx, vpy] = toMap(vx, vy)
      const [vpw, vph] = toMapSize(vw, vh)

      ctx.strokeStyle = 'rgba(59,130,246,0.9)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(59,130,246,0.08)'
      ctx.beginPath()
      ctx.roundRect(vpx, vpy, vpw, vph, 2)
      ctx.fill()
      ctx.stroke()
    }
  }, [shapes, stageRef])

  useEffect(() => {
    draw()
  }, [draw])

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const stage = stageRef.current
    if (!stage) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    // Reverse-map minimap click to canvas coordinates
    const rawBounds = getShapesBounds(shapes)
    const stageScale = stage.scaleX()

    const bounds = rawBounds ?? {
      minX: (-stage.x()) / stageScale,
      minY: (-stage.y()) / stageScale,
      maxX: (window.innerWidth - stage.x()) / stageScale,
      maxY: (window.innerHeight - stage.y()) / stageScale,
    }

    const padded = {
      minX: bounds.minX - PAD,
      minY: bounds.minY - PAD,
      maxX: bounds.maxX + PAD,
      maxY: bounds.maxY + PAD,
    }

    const contentW = padded.maxX - padded.minX
    const contentH = padded.maxY - padded.minY

    const scaleX = MAP_W / contentW
    const scaleY = MAP_H / contentH
    const mapScale = Math.min(scaleX, scaleY)

    const scaledW = contentW * mapScale
    const scaledH = contentH * mapScale
    const offsetX = (MAP_W - scaledW) / 2
    const offsetY = (MAP_H - scaledH) / 2

    // Map click to canvas coords
    const canvasX = (clickX - offsetX) / mapScale + padded.minX
    const canvasY = (clickY - offsetY) / mapScale + padded.minY

    // Center the stage on this canvas point
    stage.position({
      x: window.innerWidth / 2 - canvasX * stageScale,
      y: window.innerHeight / 2 - canvasY * stageScale,
    })

    // Trigger a redraw on next frame
    requestAnimationFrame(draw)
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 60,
        right: 4,
        width: MAP_W,
        height: MAP_H,
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: 10,
        overflow: 'hidden',
        zIndex: 19,
      }}
    >
      <canvas
        ref={canvasRef}
        width={MAP_W}
        height={MAP_H}
        onClick={handleClick}
        style={{
          display: 'block',
          width: MAP_W,
          height: MAP_H,
          cursor: 'crosshair',
        }}
      />
    </div>
  )
}

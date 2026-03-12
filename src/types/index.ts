export type ToolType = 'select' | 'pen' | 'rect' | 'ellipse' | 'sticky'

export interface CursorState {
  id: string
  name: string
  color: string
  cursor: { x: number; y: number } | null
}

// ── Shapes ────────────────────────────────────────────────

interface BaseShape {
  id: string
  userId: string
  color: string
}

export interface PathShape extends BaseShape {
  type: 'path'
  points: number[]
  strokeWidth: number
}

export interface RectShape extends BaseShape {
  type: 'rect'
  x: number
  y: number
  width: number
  height: number
}

export interface EllipseShape extends BaseShape {
  type: 'ellipse'
  x: number
  y: number
  radiusX: number
  radiusY: number
}

export interface StickyShape extends BaseShape {
  type: 'sticky'
  x: number
  y: number
  width: number
  height: number
  content: string
  bgColor: string
}

export type Shape = PathShape | RectShape | EllipseShape | StickyShape

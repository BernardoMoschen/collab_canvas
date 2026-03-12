export type ToolType = 'select' | 'pen' | 'rect' | 'ellipse' | 'sticky' | 'text' | 'arrow'

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

export interface TextShape extends BaseShape {
  type: 'text'
  x: number
  y: number
  content: string
  fontSize: number
}

export interface ArrowShape extends BaseShape {
  type: 'arrow'
  x1: number
  y1: number
  x2: number
  y2: number
  strokeWidth: number
}

export type Shape = PathShape | RectShape | EllipseShape | StickyShape | TextShape | ArrowShape

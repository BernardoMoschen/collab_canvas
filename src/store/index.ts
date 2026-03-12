import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { randomUserColor, randomUserName, randomStickyColor } from '../lib/colors'
import type { ToolType } from '../types'

interface CanvasStore {
  // User identity (persisted in sessionStorage)
  userId: string
  userName: string
  userColor: string

  // Active room
  roomId: string

  // Drawing state
  tool: ToolType
  strokeColor: string
  strokeWidth: number
  stickyColor: string

  // UI
  selectedId: string | null

  setTool: (tool: ToolType) => void
  setStrokeColor: (color: string) => void
  setStickyColor: (color: string) => void
  setSelectedId: (id: string | null) => void
  setRoomId: (id: string) => void
}

function getOrCreate(key: string, fallback: () => string) {
  const stored = sessionStorage.getItem(key)
  if (stored) return stored
  const val = fallback()
  sessionStorage.setItem(key, val)
  return val
}

function getRoomIdFromUrl() {
  const hash = window.location.hash.replace('#', '')
  if (hash.length > 0) return hash
  const id = nanoid(8)
  window.location.hash = id
  return id
}

export const useStore = create<CanvasStore>((set) => ({
  userId: getOrCreate('cc_userId', nanoid),
  userName: getOrCreate('cc_userName', randomUserName),
  userColor: getOrCreate('cc_userColor', randomUserColor),

  roomId: getRoomIdFromUrl(),

  tool: 'pen',
  strokeColor: '#1e293b',
  strokeWidth: 3,
  stickyColor: randomStickyColor(),

  selectedId: null,

  setTool: (tool) => set({ tool, selectedId: null }),
  setStrokeColor: (strokeColor) => set({ strokeColor }),
  setStickyColor: (stickyColor) => set({ stickyColor }),
  setSelectedId: (selectedId) => set({ selectedId }),
  setRoomId: (roomId) => {
    window.location.hash = roomId
    set({ roomId })
  },
}))

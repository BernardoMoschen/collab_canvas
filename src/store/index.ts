import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { randomUserColor, randomUserName, randomStickyColor } from '../lib/colors'
import type { ToolType, Shape } from '../types'

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
  fillColor: string

  // Selection (multi-select)
  selectedIds: string[]

  // Clipboard
  clipboard: Shape[] | null

  // UI preferences (persisted in localStorage)
  darkMode: boolean
  gridEnabled: boolean
  snapToGrid: boolean

  // Read-only (from URL param ?readonly)
  readOnly: boolean

  setTool: (tool: ToolType) => void
  setStrokeColor: (color: string) => void
  setFillColor: (color: string) => void
  setStickyColor: (color: string) => void
  setSelectedIds: (ids: string[]) => void
  toggleSelectedId: (id: string) => void
  setClipboard: (shapes: Shape[] | null) => void
  setRoomId: (id: string) => void
  setUserName: (name: string) => void
  toggleDarkMode: () => void
  toggleGrid: () => void
  toggleSnapToGrid: () => void
}

function getOrCreate(key: string, fallback: () => string) {
  const stored = sessionStorage.getItem(key)
  if (stored) return stored
  const val = fallback()
  sessionStorage.setItem(key, val)
  return val
}

function getLocalBool(key: string, fallback: boolean) {
  const stored = localStorage.getItem(key)
  return stored !== null ? stored === 'true' : fallback
}

function getRoomIdFromUrl() {
  const hash = window.location.hash.replace('#', '').split('?')[0]
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
  fillColor: 'transparent',

  selectedIds: [],
  clipboard: null,

  darkMode: getLocalBool('cc_darkMode', false),
  gridEnabled: getLocalBool('cc_grid', false),
  snapToGrid: getLocalBool('cc_snap', false),

  readOnly: new URLSearchParams(window.location.search).has('readonly'),

  setTool: (tool) => set({ tool, selectedIds: [] }),
  setStrokeColor: (strokeColor) => set({ strokeColor }),
  setFillColor: (fillColor) => set({ fillColor }),
  setStickyColor: (stickyColor) => set({ stickyColor }),
  setSelectedIds: (selectedIds) => set({ selectedIds }),
  toggleSelectedId: (id) => set((s) => ({
    selectedIds: s.selectedIds.includes(id)
      ? s.selectedIds.filter((x) => x !== id)
      : [...s.selectedIds, id],
  })),
  setClipboard: (clipboard) => set({ clipboard }),
  setRoomId: (roomId) => {
    window.location.hash = roomId
    set({ roomId })
  },
  setUserName: (userName) => {
    sessionStorage.setItem('cc_userName', userName)
    set({ userName })
  },
  toggleDarkMode: () => set((s) => {
    const darkMode = !s.darkMode
    localStorage.setItem('cc_darkMode', String(darkMode))
    return { darkMode }
  }),
  toggleGrid: () => set((s) => {
    const gridEnabled = !s.gridEnabled
    localStorage.setItem('cc_grid', String(gridEnabled))
    return { gridEnabled }
  }),
  toggleSnapToGrid: () => set((s) => {
    const snapToGrid = !s.snapToGrid
    localStorage.setItem('cc_snap', String(snapToGrid))
    return { snapToGrid }
  }),
}))

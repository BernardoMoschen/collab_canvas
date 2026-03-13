import { useEffect, useRef, useState } from 'react'
import { useStore } from './store'
import { initRoom } from './lib/room'
import { Canvas, globalStageRef } from './components/Canvas'
import { Toolbar } from './components/Toolbar'
import { RoomHeader } from './components/RoomHeader'
import { UserList } from './components/UserList'
import { ExportButton } from './components/ExportButton'
import { ClearCanvas } from './components/ClearCanvas'
import { ZoomControls } from './components/ZoomControls'
import { ShortcutsModal } from './components/ShortcutsModal'
import { Minimap } from './components/Minimap'
import { useShapes } from './hooks/useShapes'

export default function App() {
  const { roomId, userId, userName, userColor, darkMode } = useStore()
  const initRef = useRef(false)
  const [initialized, setInitialized] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    initRoom(roomId, userId, userName, userColor)
    setInitialized(true)
  }, [roomId, userId, userName, userColor])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
      if (e.key === '?') {
        e.preventDefault()
        setShowShortcuts((s) => !s)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!initialized) return null

  return (
    <AppInner
      darkMode={darkMode}
      showShortcuts={showShortcuts}
      onCloseShortcuts={() => setShowShortcuts(false)}
    />
  )
}

// Separate component so useShapes can run after room is initialized
function AppInner({ darkMode, showShortcuts, onCloseShortcuts }: {
  darkMode: boolean
  showShortcuts: boolean
  onCloseShortcuts: () => void
}) {
  const { readOnly } = useStore()
  const shapes = useShapes()

  return (
    <div
      style={{
        width: '100vw', height: '100vh', position: 'relative',
        background: darkMode ? '#0f172a' : '#f8fafc',
        colorScheme: darkMode ? 'dark' : 'light',
      }}
    >
      <RoomHeader />
      <Toolbar />
      <Canvas />
      <UserList />
      {!readOnly && <ClearCanvas />}
      <ExportButton stageRef={globalStageRef} />
      <ZoomControls />
      <Minimap shapes={shapes} stageRef={globalStageRef} />

      {showShortcuts && <ShortcutsModal onClose={onCloseShortcuts} />}

      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-xs whitespace-nowrap"
        style={{ color: darkMode ? '#475569' : '#94a3b8' }}
      >
        Del · S P R E N T A (tools) · Ctrl+Z · scroll=zoom · space+drag=pan · ?=shortcuts
      </div>
    </div>
  )
}

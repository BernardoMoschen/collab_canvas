import { useEffect, useRef } from 'react'
import { useStore } from './store'
import { initRoom } from './lib/room'
import { Canvas, globalStageRef } from './components/Canvas'
import { Toolbar } from './components/Toolbar'
import { RoomHeader } from './components/RoomHeader'
import { UserList } from './components/UserList'
import { ExportButton } from './components/ExportButton'
import { ClearCanvas } from './components/ClearCanvas'
import { ZoomControls } from './components/ZoomControls'

export default function App() {
  const { roomId, userId, userName, userColor } = useStore()
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    initRoom(roomId, userId, userName, userColor)
  }, [roomId, userId, userName, userColor])

  if (!initialized.current) return null

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#f8fafc' }}>
      <RoomHeader />
      <Toolbar />
      <Canvas />
      <UserList />
      <ClearCanvas />
      <ExportButton stageRef={globalStageRef} />
      <ZoomControls />

      <div
        className="absolute bottom-4 right-4 z-10 text-xs"
        style={{ color: '#94a3b8' }}
      >
        Del · S P R E N T A · Ctrl+Z · scroll to zoom · space+drag to pan
      </div>
    </div>
  )
}

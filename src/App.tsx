import { useEffect, useRef } from 'react'
import { useStore } from './store'
import { initRoom } from './lib/room'
import { Canvas } from './components/Canvas'
import { Toolbar } from './components/Toolbar'
import { RoomHeader } from './components/RoomHeader'

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

      <div
        className="absolute bottom-4 right-4 z-10 text-xs"
        style={{ color: '#94a3b8' }}
      >
        Del to remove selected · drag to move (select tool)
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useStore } from '../store'
import { nanoid } from 'nanoid'

export function RoomHeader() {
  const { roomId, userName, userColor, setRoomId } = useStore()
  const [copied, setCopied] = useState(false)

  const shareUrl = `${window.location.origin}${window.location.pathname}#${roomId}`

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function newRoom() {
    setRoomId(nanoid(8))
    window.location.reload()
  }

  return (
    <div
      className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        border: '1px solid rgba(0,0,0,0.07)',
      }}
    >
      {/* Brand */}
      <span className="text-sm font-bold tracking-tight" style={{ color: '#6366f1' }}>
        collab-canvas
      </span>

      <div className="w-px h-4" style={{ background: 'rgba(0,0,0,0.12)' }} />

      {/* Room ID */}
      <code className="text-xs font-mono" style={{ color: '#64748b' }}>
        #{roomId}
      </code>

      {/* Copy link */}
      <button
        onClick={copyLink}
        className="text-xs px-3 py-1 rounded-lg font-medium transition-all"
        style={{
          background: copied ? '#22c55e' : '#6366f1',
          color: '#fff',
          boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
        }}
      >
        {copied ? '✓ Copied' : 'Share link'}
      </button>

      {/* New room */}
      <button
        onClick={newRoom}
        className="text-xs px-2 py-1 rounded-lg font-medium transition-all"
        style={{ background: 'rgba(0,0,0,0.06)', color: '#64748b' }}
        title="Open a fresh room"
      >
        + New room
      </button>

      <div className="w-px h-4" style={{ background: 'rgba(0,0,0,0.12)' }} />

      {/* Current user */}
      <div className="flex items-center gap-2">
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ background: userColor }}
        >
          {userName[0]?.toUpperCase()}
        </div>
        <span className="text-xs font-medium" style={{ color: '#334155' }}>
          {userName}
        </span>
      </div>
    </div>
  )
}

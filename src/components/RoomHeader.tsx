import { useRef, useState } from 'react'
import { useStore } from '../store'
import { getRoom } from '../lib/room'
import { nanoid } from 'nanoid'
import { useConnectionStatus } from '../hooks/useConnectionStatus'

export function RoomHeader() {
  const { roomId, userName, userColor, setRoomId, setUserName } = useStore()
  const connStatus = useConnectionStatus()
  const [copied, setCopied] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(userName)
  const nameInputRef = useRef<HTMLInputElement>(null)

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

  function commitName() {
    const trimmed = nameValue.trim()
    if (trimmed) {
      setUserName(trimmed)
      // Update awareness so peers see the new name immediately
      try {
        const { provider } = getRoom()
        provider.awareness.setLocalStateField('name', trimmed)
      } catch { /* room not initialized yet */ }
    } else {
      setNameValue(userName)
    }
    setEditingName(false)
  }

  return (
    <div
      className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        border: '1px solid rgba(0,0,0,0.07)',
      }}
    >
      {/* Brand */}
      <span className="text-xs font-semibold" style={{ color: '#6366f1' }}>
        collab-canvas
      </span>

      <div className="w-px h-3.5" style={{ background: 'rgba(0,0,0,0.12)' }} />

      {/* Connection status dot */}
      <div
        title={connStatus}
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          flexShrink: 0,
          background: connStatus === 'connected' ? '#22c55e' : connStatus === 'connecting' ? '#f59e0b' : '#ef4444',
          boxShadow: connStatus === 'connected' ? '0 0 0 2px rgba(34,197,94,0.25)' : undefined,
          transition: 'background 0.3s',
        }}
      />

      {/* Room ID */}
      <code className="text-xs font-mono" style={{ color: '#94a3b8' }}>
        #{roomId}
      </code>

      {/* Copy link */}
      <button
        onClick={copyLink}
        className="text-xs px-2.5 py-0.5 rounded-md font-medium transition-all"
        style={{
          background: copied ? '#22c55e' : '#6366f1',
          color: '#fff',
        }}
      >
        {copied ? '✓ Copied' : 'Share'}
      </button>

      {/* New room */}
      <button
        onClick={newRoom}
        className="text-xs px-2.5 py-0.5 rounded-md font-medium transition-all"
        style={{ background: 'rgba(0,0,0,0.06)', color: '#64748b' }}
        title="Open a fresh room"
      >
        New room
      </button>

      <div className="w-px h-3.5" style={{ background: 'rgba(0,0,0,0.12)' }} />

      {/* Current user */}
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
        style={{ background: userColor, fontSize: 10 }}
      >
        {userName[0]?.toUpperCase()}
      </div>
      {editingName ? (
        <input
          ref={nameInputRef}
          value={nameValue}
          autoFocus
          onChange={(e) => setNameValue(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitName()
            if (e.key === 'Escape') { setNameValue(userName); setEditingName(false) }
          }}
          className="text-xs font-medium rounded px-1 outline-none"
          style={{
            color: '#334155',
            border: '1px solid #6366f1',
            width: Math.max(60, nameValue.length * 7 + 16),
          }}
        />
      ) : (
        <span
          className="text-xs font-medium cursor-pointer hover:underline"
          style={{ color: '#334155' }}
          title="Click to edit your name"
          onClick={() => { setNameValue(userName); setEditingName(true) }}
        >
          {userName}
        </span>
      )}
    </div>
  )
}

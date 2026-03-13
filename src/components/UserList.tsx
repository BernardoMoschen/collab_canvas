import { useAwareness } from '../hooks/useAwareness'
import { useStore } from '../store'

const COLLAPSE_THRESHOLD = 4

export function UserList() {
  const peers = useAwareness()
  const { userId, userName, userColor } = useStore()

  // Local user is always first
  const self = { id: userId, name: userName, color: userColor }
  const allUsers = [self, ...peers]
  const total = allUsers.length
  const collapsed = total > COLLAPSE_THRESHOLD

  const panelStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
    border: '1px solid rgba(0,0,0,0.07)',
  }

  return (
    <div
      className="absolute bottom-4 left-4 z-20 rounded-2xl"
      style={panelStyle}
    >
      {collapsed ? (
        // Collapsed: stacked colored circles only
        <div className="flex items-center gap-1 px-3 py-2">
          {allUsers.map((user, i) => (
            <div
              key={user.id}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{
                background: user.color,
                marginLeft: i === 0 ? 0 : -8,
                boxShadow: '0 0 0 2px rgba(255,255,255,0.92)',
                zIndex: allUsers.length - i,
                position: 'relative',
              }}
              title={user.name + (user.id === userId ? ' (You)' : '')}
            >
              {user.name[0]?.toUpperCase()}
            </div>
          ))}
          <span
            className="text-xs font-medium ml-2 flex-shrink-0"
            style={{ color: '#64748b' }}
          >
            {total} online
          </span>
        </div>
      ) : (
        // Expanded: full list
        <div className="px-3 py-2.5 min-w-[150px]">
          {/* Header */}
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#22c55e' }} />
            <span className="text-[10px] font-medium" style={{ color: '#94a3b8' }}>
              {total} online
            </span>
          </div>

          {/* User rows */}
          <div className="flex flex-col gap-1">
            {allUsers.map((user) => {
              const isLocal = user.id === userId
              return (
                <div key={user.id} className="flex items-center gap-2 min-w-0">
                  {/* Avatar circle */}
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ background: user.color, fontSize: 10 }}
                  >
                    {user.name[0]?.toUpperCase()}
                  </div>

                  {/* Name */}
                  <span
                    className="text-xs font-medium truncate flex-1 min-w-0"
                    style={{ color: '#334155' }}
                  >
                    {user.name}
                  </span>

                  {/* "You" badge */}
                  {isLocal && (
                    <span
                      className="text-[10px] font-medium px-1.5 py-px rounded flex-shrink-0"
                      style={{
                        background: 'rgba(99,102,241,0.1)',
                        color: '#6366f1',
                      }}
                    >
                      you
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

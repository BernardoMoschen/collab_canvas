import { useState, useEffect } from 'react'
import { getRoom } from '../lib/room'
import { useStore } from '../store'
import type { CursorState } from '../types'

export function useAwareness(): CursorState[] {
  const { userId } = useStore()
  const { provider } = getRoom()
  const awareness = provider.awareness

  const [cursors, setCursors] = useState<CursorState[]>([])

  useEffect(() => {
    const update = () => {
      const states: CursorState[] = []
      awareness.getStates().forEach((state, clientId) => {
        if (state.id !== userId && state.cursor !== undefined) {
          states.push({
            id: String(clientId),
            name: String(state.name ?? 'Guest'),
            color: String(state.color ?? '#888'),
            cursor: state.cursor as CursorState['cursor'],
          })
        }
      })
      setCursors(states)
    }

    awareness.on('change', update)
    return () => awareness.off('change', update)
  }, [awareness, userId])

  return cursors
}

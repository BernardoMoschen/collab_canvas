import { useState, useEffect } from 'react'
import { getRoom } from '../lib/room'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

export function useConnectionStatus(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>('connecting')

  useEffect(() => {
    const { provider } = getRoom()
    const handler = ({ status: s }: { status: ConnectionStatus }) => setStatus(s)
    provider.on('status', handler)
    return () => provider.off('status', handler)
  }, [])

  return status
}

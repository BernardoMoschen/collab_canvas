import { useState, useEffect } from 'react'
import { undo, redo, canUndo, canRedo, getUndoManager } from '../lib/undoManager'

export function useUndoRedo() {
  const [, setTick] = useState(0)
  const bump = () => setTick((n) => n + 1)

  useEffect(() => {
    const um = getUndoManager()
    if (!um) return
    um.on('stack-item-added', bump)
    um.on('stack-item-popped', bump)
    return () => {
      um.off('stack-item-added', bump)
      um.off('stack-item-popped', bump)
    }
  }, [])

  return { undo, redo, canUndo: canUndo(), canRedo: canRedo() }
}
